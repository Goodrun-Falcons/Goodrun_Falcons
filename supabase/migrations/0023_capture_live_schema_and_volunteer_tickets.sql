-- Two things in one migration:
--
-- A. Capture objects that exist on the live database but never had a
--    migration file (added directly in Supabase by the mobile work), so a
--    fresh database built from migrations matches live. Everything here is
--    idempotent: on live it is a no-op; on a fresh database it creates them.
--
-- B. Fix: support tickets can be created by volunteers (organisation_id is
--    null, volunteer_id set). The notification triggers from 0020 assumed
--    an organisation and would have errored on those tickets, blocking an
--    admin's reply or status change. Notify whichever of org/volunteer owns
--    the ticket instead.

-- ── A. columns ────────────────────────────────────────────────────────────────
alter table requests
  add column if not exists volunteer_id uuid
    references volunteers(id) on update cascade on delete cascade,
  add column if not exists accepted_at timestamptz,
  add column if not exists total_package_size text not null default 'small';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'requests_total_package_size_check') then
    alter table requests add constraint requests_total_package_size_check
      check (total_package_size in ('large', 'medium', 'small'));
  end if;
end $$;

alter table pickups
  add column if not exists assigned_by uuid references admins(id);

alter table volunteers
  add column if not exists security_question_one text,
  add column if not exists security_answer_one text,
  add column if not exists security_question_two text,
  add column if not exists security_answer_two text;

alter table support_tickets
  alter column organisation_id drop not null,
  add column if not exists volunteer_id uuid
    references volunteers(id) on update cascade;

-- ── A. route_stops ────────────────────────────────────────────────────────────
create table if not exists route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null default gen_random_uuid() references routes(id),
  pickup_id uuid not null references pickups(id),
  stop_type text not null default 'pickup' check (stop_type in ('pickup', 'dropoff')),
  sequence_number integer not null
);

alter table route_stops enable row level security;

-- ── A. policies (created only if missing) ─────────────────────────────────────
create or replace function pg_temp.ensure_policy(p_table text, p_name text, p_ddl text)
returns void as $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = p_table and policyname = p_name
  ) then
    execute p_ddl;
  end if;
end;
$$ language plpgsql;

select pg_temp.ensure_policy('pickups', 'Volunteer can insert pickups',
  $p$create policy "Volunteer can insert pickups" on pickups for insert
     with check (auth.uid() = volunteer_id)$p$);

select pg_temp.ensure_policy('pickups', 'Volunteers can delete pickups',
  $p$create policy "Volunteers can delete pickups" on pickups for delete
     using (auth.uid() = volunteer_id)$p$);

select pg_temp.ensure_policy('requests', 'Volunteer can update requests',
  $p$create policy "Volunteer can update requests" on requests for update
     using ((volunteer_id = (select auth.uid())) or (volunteer_id is null))$p$);

select pg_temp.ensure_policy('route_stops', 'Admin can manage all stops',
  $p$create policy "Admin can manage all stops" on route_stops for all to authenticated
     using (exists (select 1 from admins where admins.id = auth.uid()))$p$);

select pg_temp.ensure_policy('route_stops', 'Volunteer can manage their stops',
  $p$create policy "Volunteer can manage their stops" on route_stops for all to authenticated
     using (exists (
       select 1 from routes r
       where r.id = route_stops.route_id and r.volunteer_id = (select auth.uid())
     ))$p$);

select pg_temp.ensure_policy('support_tickets', 'Volunteer can create tickets',
  $p$create policy "Volunteer can create tickets" on support_tickets for insert to authenticated
     with check (volunteer_id = (select auth.uid()))$p$);

select pg_temp.ensure_policy('support_tickets', 'Volunteer can view tickets',
  $p$create policy "Volunteer can view tickets" on support_tickets for select
     using (auth.uid() = volunteer_id)$p$);

select pg_temp.ensure_policy('volunteers', 'Volunteer can create own profile',
  $p$create policy "Volunteer can create own profile" on volunteers for insert to authenticated
     with check ((select auth.uid()) = id)$p$);

-- ── B. notifications for volunteer-owned tickets ──────────────────────────────
-- A null recipient is skipped instead of raising.
create or replace function notify_user(
  p_user_id uuid, p_type text, p_title text, p_body text, p_link text
) returns void as $$
begin
  if p_user_id is null then
    return;
  end if;
  delete from notifications where created_at < now() - interval '7 days';
  insert into notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
end;
$$ language plpgsql security definer set search_path = public;

create or replace function trg_notify_ticket_status() returns trigger as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  perform notify_user(
    coalesce(new.organisation_id, new.volunteer_id),
    'ticket_status',
    case new.status
      when 'resolved' then 'Ticket ' || ticket_label(new.ticket_number) || ' resolved'
      when 'in_progress' then 'Ticket ' || ticket_label(new.ticket_number) || ' in progress'
      else 'Ticket ' || ticket_label(new.ticket_number) || ' reopened'
    end,
    new.subject,
    case when new.organisation_id is not null then '/org/support' end
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function trg_notify_ticket_message() returns trigger as $$
declare
  t support_tickets%rowtype;
begin
  select * into t from support_tickets where id = new.ticket_id;

  if new.sender_type = 'admin' then
    perform notify_user(
      coalesce(t.organisation_id, t.volunteer_id),
      'ticket_reply',
      'New reply on ' || ticket_label(t.ticket_number),
      left(new.message, 140),
      case when t.organisation_id is not null then '/org/support' end
    );
  else
    perform notify_admins(
      'ticket_reply',
      'Reply on ' || ticket_label(t.ticket_number),
      left(new.message, 140),
      '/admin/support-tickets'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

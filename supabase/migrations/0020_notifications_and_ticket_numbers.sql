-- Persistent notifications (kept 7 days) + human-friendly ticket numbers.
--
-- Notifications are written by database triggers so they appear regardless
-- of who made the change (web admin, org, or the mobile backend using the
-- service role). Clients only read their own rows and mark them read.

-- ── ticket numbers ────────────────────────────────────────────────────────────
create sequence if not exists support_ticket_number_seq;

alter table support_tickets add column if not exists ticket_number bigint;

-- Backfill existing tickets in order of creation.
with numbered as (
  select id, row_number() over (order by created_at, id) as n from support_tickets
)
update support_tickets t set ticket_number = numbered.n
from numbered where t.id = numbered.id and t.ticket_number is null;

select setval(
  'support_ticket_number_seq',
  greatest((select coalesce(max(ticket_number), 0) from support_tickets), 1),
  (select coalesce(max(ticket_number), 0) from support_tickets) > 0
);

alter table support_tickets
  alter column ticket_number set default nextval('support_ticket_number_seq'),
  alter column ticket_number set not null;

alter sequence support_ticket_number_seq owned by support_tickets.ticket_number;

create unique index if not exists idx_support_tickets_ticket_number
  on support_tickets (ticket_number);

create or replace function ticket_label(n bigint)
returns text as $$
  select 'GR-' || lpad(n::text, 4, '0');
$$ language sql immutable;

-- ── notifications table ───────────────────────────────────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_created on notifications (user_id, created_at desc);
create index idx_notifications_created on notifications (created_at);

alter table notifications enable row level security;

create policy "Users can view own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "Users can mark own notifications read"
  on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- ── helpers ───────────────────────────────────────────────────────────────────
create or replace function notify_user(
  p_user_id uuid, p_type text, p_title text, p_body text, p_link text
) returns void as $$
begin
  -- Retention: anything older than 7 days is purged opportunistically.
  delete from notifications where created_at < now() - interval '7 days';
  insert into notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
end;
$$ language plpgsql security definer set search_path = public;

create or replace function notify_admins(
  p_type text, p_title text, p_body text, p_link text
) returns void as $$
declare
  a record;
begin
  for a in select id from admins loop
    perform notify_user(a.id, p_type, p_title, p_body, p_link);
  end loop;
end;
$$ language plpgsql security definer set search_path = public;

-- Only triggers should call these.
revoke all on function notify_user(uuid, text, text, text, text) from public;
revoke all on function notify_admins(text, text, text, text) from public;

-- ── requests ──────────────────────────────────────────────────────────────────
create or replace function trg_notify_request_insert() returns trigger as $$
declare
  org_name text;
begin
  select name into org_name from organisations where id = new.organisation_id;
  perform notify_admins(
    'request_submitted',
    'New delivery request',
    coalesce(org_name, 'An organisation') || ' submitted a request awaiting review.',
    '/admin/deliveries'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger notify_request_insert
  after insert on requests
  for each row execute function trg_notify_request_insert();

create or replace function trg_notify_request_status() returns trigger as $$
declare
  items_label text;
  status_label text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select string_agg(quantity || ' × ' || item_type, ', ') into items_label
  from request_items where request_id = new.id;

  status_label := case new.status
    when 'pending' then 'submitted'
    when 'approved' then 'approved'
    when 'rejected' then 'rejected'
    when 'accepted' then 'matched to a volunteer'
    when 'in_transit' then 'in transit'
    when 'delivered' then 'delivered'
    else new.status
  end;

  perform notify_user(
    new.organisation_id,
    'request_status',
    'Request ' || status_label,
    coalesce(items_label, 'Your request') || ' is now ' || status_label || '.',
    '/org/requests/' || new.id
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger notify_request_status
  after update of status on requests
  for each row execute function trg_notify_request_status();

-- ── signup requests ───────────────────────────────────────────────────────────
create or replace function trg_notify_signup_insert() returns trigger as $$
begin
  perform notify_admins(
    'signup_submitted',
    'New organisation registration',
    new.name || ' is waiting for approval.',
    '/admin/account-approval'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger notify_signup_insert
  after insert on signup_requests
  for each row execute function trg_notify_signup_insert();

-- ── support tickets ───────────────────────────────────────────────────────────
create or replace function trg_notify_ticket_insert() returns trigger as $$
begin
  perform notify_admins(
    'ticket_created',
    'New support ticket ' || ticket_label(new.ticket_number),
    new.subject,
    '/admin/support-tickets'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger notify_ticket_insert
  after insert on support_tickets
  for each row execute function trg_notify_ticket_insert();

create or replace function trg_notify_ticket_status() returns trigger as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  perform notify_user(
    new.organisation_id,
    'ticket_status',
    case new.status
      when 'resolved' then 'Ticket ' || ticket_label(new.ticket_number) || ' resolved'
      when 'in_progress' then 'Ticket ' || ticket_label(new.ticket_number) || ' in progress'
      else 'Ticket ' || ticket_label(new.ticket_number) || ' reopened'
    end,
    new.subject,
    '/org/support'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger notify_ticket_status
  after update of status on support_tickets
  for each row execute function trg_notify_ticket_status();

create or replace function trg_notify_ticket_message() returns trigger as $$
declare
  t support_tickets%rowtype;
begin
  select * into t from support_tickets where id = new.ticket_id;

  if new.sender_type = 'admin' then
    perform notify_user(
      t.organisation_id,
      'ticket_reply',
      'New reply on ' || ticket_label(t.ticket_number),
      left(new.message, 140),
      '/org/support'
    );
  else
    perform notify_admins(
      'ticket_reply',
      'Org replied on ' || ticket_label(t.ticket_number),
      left(new.message, 140),
      '/admin/support-tickets'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger notify_ticket_message
  after insert on support_ticket_messages
  for each row execute function trg_notify_ticket_message();

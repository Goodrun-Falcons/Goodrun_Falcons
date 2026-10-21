-- Org access hardening + privacy.
--
-- 1. Orgs could UPDATE their own row without column limits, so a
--    deactivated org could re-activate itself. A trigger now blocks
--    non-admins from changing verified/active.
-- 2. requests/request_items were readable by every authenticated user, so
--    one org could read another's requests. Now: own org, admins, volunteers.
-- 3. Approval was two client-side calls (upsert org, then update signup
--    request) and never copied the security questions/answers across, so
--    security-question password reset could not work for approved orgs.
--    approve_signup_request / reject_signup_request do it in one transaction.
-- 4. Rejected signups can carry a reason shown to the org at login.

-- ── 4. rejection reason ───────────────────────────────────────────────────────
alter table signup_requests add column if not exists rejection_reason text;

-- ── 1. protect verified/active ────────────────────────────────────────────────
create or replace function protect_org_admin_fields()
returns trigger as $$
begin
  -- auth.uid() is null for service-role / direct DB sessions: allow those.
  if auth.uid() is not null
    and (new.verified is distinct from old.verified or new.active is distinct from old.active)
    and not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'Only admins can change verified or active';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger protect_organisation_admin_fields
  before update on organisations
  for each row execute function protect_org_admin_fields();

-- ── 2. scope request visibility ───────────────────────────────────────────────
drop policy if exists "Authenticated users can view requests" on requests;
create policy "Orgs, admins and volunteers can view requests"
  on requests for select
  using (
    organisation_id = auth.uid()
    or exists (select 1 from admins where id = auth.uid())
    or exists (select 1 from volunteers where id = auth.uid())
  );

drop policy if exists "Authenticated users can view request items" on request_items;
create policy "Users can view items of requests they can see"
  on request_items for select
  using (exists (select 1 from requests where requests.id = request_items.request_id));

-- ── 3. atomic approve / reject ────────────────────────────────────────────────
-- Skip re-hashing when the approval function copies already-hashed answers.
create or replace function hash_security_answers()
returns trigger as $$
begin
  if current_setting('app.skip_answer_hash', true) = 'on' then
    return new;
  end if;
  if new.security_answer_1_hash is not null
    and (tg_op = 'INSERT' or new.security_answer_1_hash is distinct from old.security_answer_1_hash) then
    new.security_answer_1_hash := extensions.crypt(
      lower(trim(new.security_answer_1_hash)), extensions.gen_salt('bf')
    );
  end if;
  if new.security_answer_2_hash is not null
    and (tg_op = 'INSERT' or new.security_answer_2_hash is distinct from old.security_answer_2_hash) then
    new.security_answer_2_hash := extensions.crypt(
      lower(trim(new.security_answer_2_hash)), extensions.gen_salt('bf')
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, extensions;

create or replace function approve_signup_request(p_request_id uuid)
returns void as $$
declare
  r signup_requests%rowtype;
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'Only admins can approve signup requests';
  end if;

  select * into r from signup_requests where id = p_request_id for update;
  if not found then
    raise exception 'Signup request not found';
  end if;
  if r.status <> 'pending' then
    raise exception 'Signup request is already %', r.status;
  end if;

  perform set_config('app.skip_answer_hash', 'on', true);

  insert into organisations (
    id, name, email, phone, address, verified, active,
    security_question_1, security_answer_1_hash,
    security_question_2, security_answer_2_hash
  ) values (
    r.auth_user_id, r.name, r.email, r.phone, r.address, true, true,
    r.security_question_1, r.security_answer_1_hash,
    r.security_question_2, r.security_answer_2_hash
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone,
    address = excluded.address,
    verified = true,
    active = true,
    security_question_1 = excluded.security_question_1,
    security_answer_1_hash = excluded.security_answer_1_hash,
    security_question_2 = excluded.security_question_2,
    security_answer_2_hash = excluded.security_answer_2_hash;

  perform set_config('app.skip_answer_hash', 'off', true);

  update signup_requests
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_request_id;
end;
$$ language plpgsql security definer set search_path = public, extensions;

create or replace function reject_signup_request(p_request_id uuid, p_reason text default null)
returns void as $$
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'Only admins can reject signup requests';
  end if;

  update signup_requests
    set status = 'rejected',
        rejection_reason = nullif(trim(p_reason), ''),
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = p_request_id and status = 'pending';

  if not found then
    raise exception 'Signup request not found or already reviewed';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function approve_signup_request(uuid) from public;
revoke all on function reject_signup_request(uuid, text) from public;
grant execute on function approve_signup_request(uuid) to authenticated;
grant execute on function reject_signup_request(uuid, text) to authenticated;

-- Request lifecycle: org edit/cancel, atomic create, admin volunteer
-- assignment, and a private bucket for proof-of-delivery photos.

-- ── 'cancelled' status ────────────────────────────────────────────────────────
alter table requests drop constraint requests_status_check;
alter table requests add constraint requests_status_check
  check (status in ('pending', 'approved', 'rejected', 'cancelled', 'accepted', 'in_transit', 'delivered'));

-- A cancel notifies admins; every other status change still notifies the org.
create or replace function trg_notify_request_status() returns trigger as $$
declare
  items_label text;
  status_label text;
  org_name text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select string_agg(quantity || ' × ' || item_type, ', ') into items_label
  from request_items where request_id = new.id;

  if new.status = 'cancelled' then
    select name into org_name from organisations where id = new.organisation_id;
    perform notify_admins(
      'request_cancelled',
      'Request cancelled',
      coalesce(org_name, 'An organisation') || ' cancelled ' || coalesce(items_label, 'a request') || '.',
      '/admin/deliveries'
    );
    return new;
  end if;

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

-- ── org: create / edit / cancel ───────────────────────────────────────────────
create or replace function assert_active_org() returns void as $$
begin
  if not exists (
    select 1 from organisations where id = auth.uid() and verified and active
  ) then
    raise exception 'Only active, verified organisations can manage requests';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function insert_request_items(p_request_id uuid, p_items jsonb)
returns void as $$
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A request needs at least one item';
  end if;

  insert into request_items (request_id, item_type, quantity)
  select p_request_id, trim(i->>'item_type'), greatest(1, coalesce((i->>'quantity')::int, 1))
  from jsonb_array_elements(p_items) as i
  where coalesce(trim(i->>'item_type'), '') <> '';

  if not exists (select 1 from request_items where request_id = p_request_id) then
    raise exception 'A request needs at least one item';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function create_request(
  p_description text,
  p_urgency text,
  p_tag text,
  p_pickup_address text,
  p_dropoff_address text,
  p_pickup_lng double precision,
  p_pickup_lat double precision,
  p_dropoff_lng double precision,
  p_dropoff_lat double precision,
  p_items jsonb
) returns uuid as $$
declare
  new_id uuid;
begin
  perform assert_active_org();

  insert into requests (
    organisation_id, description, urgency, tag,
    pickup_address, dropoff_address, pickup_location, dropoff_location
  ) values (
    auth.uid(), nullif(trim(p_description), ''), p_urgency, p_tag,
    trim(p_pickup_address), nullif(trim(p_dropoff_address), ''),
    st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::geography,
    case when p_dropoff_lng is not null and p_dropoff_lat is not null
      then st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography end
  ) returning id into new_id;

  perform insert_request_items(new_id, p_items);
  return new_id;
end;
$$ language plpgsql security definer set search_path = public, extensions;

create or replace function update_pending_request(
  p_request_id uuid,
  p_description text,
  p_urgency text,
  p_tag text,
  p_pickup_address text,
  p_dropoff_address text,
  p_pickup_lng double precision,
  p_pickup_lat double precision,
  p_dropoff_lng double precision,
  p_dropoff_lat double precision,
  p_items jsonb
) returns void as $$
begin
  perform assert_active_org();

  update requests set
    description = nullif(trim(p_description), ''),
    urgency = p_urgency,
    tag = p_tag,
    pickup_address = trim(p_pickup_address),
    dropoff_address = nullif(trim(p_dropoff_address), ''),
    pickup_location = st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::geography,
    dropoff_location = case when p_dropoff_lng is not null and p_dropoff_lat is not null
      then st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography end
  where id = p_request_id and organisation_id = auth.uid() and status = 'pending';

  if not found then
    raise exception 'Only your own requests that are still awaiting review can be edited';
  end if;

  delete from request_items where request_id = p_request_id;
  perform insert_request_items(p_request_id, p_items);
end;
$$ language plpgsql security definer set search_path = public, extensions;

create or replace function cancel_request(p_request_id uuid)
returns void as $$
begin
  perform assert_active_org();

  update requests set status = 'cancelled'
  where id = p_request_id
    and organisation_id = auth.uid()
    and status in ('pending', 'approved');

  if not found then
    raise exception 'This request can no longer be cancelled';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

-- ── admin: assign a volunteer ─────────────────────────────────────────────────
-- Only an approved request can be assigned; the status guard means that if a
-- volunteer accepts it on mobile at the same moment, exactly one side wins.
create or replace function admin_assign_volunteer(p_request_id uuid, p_volunteer_id uuid)
returns void as $$
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'Only admins can assign volunteers';
  end if;

  if not exists (select 1 from volunteers where id = p_volunteer_id and status = 'active') then
    raise exception 'Volunteer is not active';
  end if;

  -- Mirror what the volunteer app's accept does (status + volunteer_id +
  -- accepted_at); its My Route list filters on requests.volunteer_id.
  update requests
  set status = 'accepted', volunteer_id = p_volunteer_id, accepted_at = now()
  where id = p_request_id and status = 'approved' and volunteer_id is null;

  if not found then
    raise exception 'Request is no longer awaiting a volunteer';
  end if;

  insert into pickups (request_id, volunteer_id, status)
  values (p_request_id, p_volunteer_id, 'assigned');
end;
$$ language plpgsql security definer set search_path = public;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'assert_active_org()',
    'insert_request_items(uuid, jsonb)',
    'create_request(text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb)',
    'update_pending_request(uuid, text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb)',
    'cancel_request(uuid)',
    'admin_assign_volunteer(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public', fn);
  end loop;
end $$;

grant execute on function create_request(text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb) to authenticated;
grant execute on function update_pending_request(uuid, text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb) to authenticated;
grant execute on function cancel_request(uuid) to authenticated;
grant execute on function admin_assign_volunteer(uuid, uuid) to authenticated;

-- ── proof-of-delivery photos ──────────────────────────────────────────────────
-- Private bucket. The backend stores objects as "<volunteer_id>/<pickup_id>/<file>"
-- and saves that path in pickups.handover_photo. Orgs read photos for their own
-- requests, admins read all, volunteers manage their own folder.
insert into storage.buckets (id, name, public)
values ('handover-photos', 'handover-photos', false)
on conflict (id) do nothing;

create policy "Orgs can view handover photos for own requests"
  on storage.objects for select
  using (
    bucket_id = 'handover-photos'
    and exists (
      select 1
      from pickups p
      join requests r on r.id = p.request_id
      where p.id::text = (storage.foldername(name))[2]
        and r.organisation_id = auth.uid()
    )
  );

create policy "Admins can view all handover photos"
  on storage.objects for select
  using (
    bucket_id = 'handover-photos'
    and exists (select 1 from admins where id = auth.uid())
  );

create policy "Volunteers can manage own handover photos"
  on storage.objects for all
  using (
    bucket_id = 'handover-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'handover-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

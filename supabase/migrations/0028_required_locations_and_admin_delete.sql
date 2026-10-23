-- 1. Pickup and drop-off are both mandatory on every new or edited request.
--    The columns stay nullable because requests created before this migration
--    may have no drop-off; only the create/update paths enforce it.
-- 2. Admins can delete a request that is still pending review or awaiting a
--    driver (e.g. approved by mistake or no longer needed). There is no DELETE
--    policy on requests, so this goes through a security-definer function.

create or replace function assert_request_locations(
  p_pickup_address text,
  p_dropoff_address text,
  p_pickup_lng double precision,
  p_pickup_lat double precision,
  p_dropoff_lng double precision,
  p_dropoff_lat double precision
) returns void as $$
begin
  if coalesce(trim(p_pickup_address), '') = '' or p_pickup_lng is null or p_pickup_lat is null then
    raise exception 'A pickup location is required';
  end if;
  if coalesce(trim(p_dropoff_address), '') = '' or p_dropoff_lng is null or p_dropoff_lat is null then
    raise exception 'A drop-off location is required';
  end if;
end;
$$ language plpgsql;

-- ── create_request ────────────────────────────────────────────────────────────
create or replace function create_request(
  p_name text,
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

  if coalesce(trim(p_name), '') = '' then
    raise exception 'A request needs a name';
  end if;

  perform assert_request_locations(
    p_pickup_address, p_dropoff_address, p_pickup_lng, p_pickup_lat, p_dropoff_lng, p_dropoff_lat
  );

  insert into requests (
    organisation_id, name, description, urgency, tag,
    pickup_address, dropoff_address, pickup_location, dropoff_location
  ) values (
    auth.uid(), trim(p_name), nullif(trim(p_description), ''), p_urgency, p_tag,
    trim(p_pickup_address), trim(p_dropoff_address),
    st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::geography,
    st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography
  ) returning id into new_id;

  perform insert_request_items(new_id, p_items);
  return new_id;
end;
$$ language plpgsql security definer set search_path = public, extensions;

-- ── update_pending_request ────────────────────────────────────────────────────
create or replace function update_pending_request(
  p_request_id uuid,
  p_name text,
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

  if coalesce(trim(p_name), '') = '' then
    raise exception 'A request needs a name';
  end if;

  perform assert_request_locations(
    p_pickup_address, p_dropoff_address, p_pickup_lng, p_pickup_lat, p_dropoff_lng, p_dropoff_lat
  );

  update requests set
    name = trim(p_name),
    description = nullif(trim(p_description), ''),
    urgency = p_urgency,
    tag = p_tag,
    pickup_address = trim(p_pickup_address),
    dropoff_address = trim(p_dropoff_address),
    pickup_location = st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::geography,
    dropoff_location = st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography
  where id = p_request_id and organisation_id = auth.uid() and status = 'pending';

  if not found then
    raise exception 'Only your own requests that are still awaiting review can be edited';
  end if;

  delete from request_items where request_id = p_request_id;
  perform insert_request_items(p_request_id, p_items);
end;
$$ language plpgsql security definer set search_path = public, extensions;

-- ── admin_create_request ──────────────────────────────────────────────────────
create or replace function admin_create_request(
  p_org_id uuid,
  p_name text,
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
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'Only admins can create deliveries on behalf of an organisation';
  end if;

  if not exists (select 1 from organisations where id = p_org_id and verified and active) then
    raise exception 'That organisation is not active';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'A request needs a name';
  end if;

  perform assert_request_locations(
    p_pickup_address, p_dropoff_address, p_pickup_lng, p_pickup_lat, p_dropoff_lng, p_dropoff_lat
  );

  insert into requests (
    organisation_id, name, description, urgency, tag, created_by_admin,
    pickup_address, dropoff_address, pickup_location, dropoff_location
  ) values (
    p_org_id, trim(p_name), nullif(trim(p_description), ''), p_urgency, p_tag, true,
    trim(p_pickup_address), trim(p_dropoff_address),
    st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::geography,
    st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography
  ) returning id into new_id;

  perform insert_request_items(new_id, p_items);
  return new_id;
end;
$$ language plpgsql security definer set search_path = public, extensions;

-- ── admin_delete_request ──────────────────────────────────────────────────────
-- Only requests with no driver yet (pending review or approved). Once a
-- volunteer has accepted it there is route and tracking history attached.
create or replace function admin_delete_request(p_request_id uuid)
returns void as $$
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'Only admins can delete deliveries';
  end if;

  delete from requests
  where id = p_request_id and status in ('pending', 'approved');

  if not found then
    raise exception 'This delivery can no longer be deleted (it was already handled or assigned to a driver)';
  end if;
end;
$$ language plpgsql security definer set search_path = public, extensions;

revoke all on function admin_delete_request(uuid) from public;
grant execute on function admin_delete_request(uuid) to authenticated;

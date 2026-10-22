-- Admin "New Delivery" inserted straight into requests / request_items, but
-- only organisations have INSERT policies on those tables (they go through
-- create_request), so the insert was always rejected by RLS.
--
-- Mirror create_request for admins: one security-definer function that checks
-- the caller is an admin and creates the request plus all its items atomically.

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

  insert into requests (
    organisation_id, name, description, urgency, tag, created_by_admin,
    pickup_address, dropoff_address, pickup_location, dropoff_location
  ) values (
    p_org_id, trim(p_name), nullif(trim(p_description), ''), p_urgency, p_tag, true,
    trim(p_pickup_address), nullif(trim(p_dropoff_address), ''),
    st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::geography,
    case when p_dropoff_lng is not null and p_dropoff_lat is not null
      then st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography end
  ) returning id into new_id;

  perform insert_request_items(new_id, p_items);
  return new_id;
end;
$$ language plpgsql security definer set search_path = public, extensions;

revoke all on function admin_create_request(uuid, text, text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb) from public;
grant execute on function admin_create_request(uuid, text, text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb) to authenticated;

-- Give each request a name chosen by the org (e.g. "Winter blanket drive")
-- so notifications and the admin side show one title instead of a list of
-- item types. Nullable: requests created before this have no name, and
-- clients fall back to the item summary.

alter table requests add column if not exists name text;

-- ── create / update RPCs now take the name ────────────────────────────────────
drop function if exists create_request(text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb);
drop function if exists update_pending_request(uuid, text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb);

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

  insert into requests (
    organisation_id, name, description, urgency, tag,
    pickup_address, dropoff_address, pickup_location, dropoff_location
  ) values (
    auth.uid(), trim(p_name), nullif(trim(p_description), ''), p_urgency, p_tag,
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

  update requests set
    name = trim(p_name),
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

revoke all on function create_request(text, text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb) from public;
revoke all on function update_pending_request(uuid, text, text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb) from public;
grant execute on function create_request(text, text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb) to authenticated;
grant execute on function update_pending_request(uuid, text, text, text, text, text, text, double precision, double precision, double precision, double precision, jsonb) to authenticated;

-- ── notifications use the request name ────────────────────────────────────────
-- Label = the request's name, falling back to the item summary for old rows.
create or replace function request_label(p_request_id uuid)
returns text as $$
  select coalesce(
    nullif(trim(r.name), ''),
    (select string_agg(quantity || ' × ' || item_type, ', ') from request_items where request_id = r.id),
    'Request'
  )
  from requests r where r.id = p_request_id;
$$ language sql stable security definer set search_path = public;

create or replace function trg_notify_request_insert() returns trigger as $$
declare
  org_name text;
begin
  select name into org_name from organisations where id = new.organisation_id;
  perform notify_admins(
    'request_submitted',
    'New delivery request',
    coalesce(org_name, 'An organisation') || ' submitted "' || coalesce(nullif(trim(new.name), ''), 'a request') || '" for review.',
    '/admin/deliveries'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function trg_notify_request_status() returns trigger as $$
declare
  label text;
  status_label text;
  org_name text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  label := request_label(new.id);

  if new.status = 'cancelled' then
    select name into org_name from organisations where id = new.organisation_id;
    perform notify_admins(
      'request_cancelled',
      'Request cancelled',
      coalesce(org_name, 'An organisation') || ' cancelled "' || label || '".',
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
    '"' || label || '" ' || status_label,
    '"' || label || '" is now ' || status_label || '.',
    '/org/requests/' || new.id
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

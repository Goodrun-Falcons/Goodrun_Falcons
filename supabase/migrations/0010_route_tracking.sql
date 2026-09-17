-- Generated lat/lng columns: geography columns serialize to raw EWKB hex via
-- PostgREST, not GeoJSON, so expose plain doubles for the client to read.
-- extensions.geometry(geography) and st_x/st_y are IMMUTABLE, so these are
-- valid as GENERATED ... STORED columns.

alter table routes
  add column current_lat double precision
    generated always as (extensions.st_y(current_location::extensions.geometry)) stored,
  add column current_lng double precision
    generated always as (extensions.st_x(current_location::extensions.geometry)) stored;

alter table items
  add column pickup_lat double precision
    generated always as (extensions.st_y(pickup_location::extensions.geometry)) stored,
  add column pickup_lng double precision
    generated always as (extensions.st_x(pickup_location::extensions.geometry)) stored,
  add column dropoff_lat double precision
    generated always as (extensions.st_y(dropoff_location::extensions.geometry)) stored,
  add column dropoff_lng double precision
    generated always as (extensions.st_x(dropoff_location::extensions.geometry)) stored;

-- RLS gap: orgs currently cannot read the route delivering their own item.
create policy "Organisations can view routes for own items"
  on routes for select
  using (
    exists (
      select 1 from pickups
      join items on items.id = pickups.item_id
      where pickups.route_id = routes.id
        and items.organisation_id = auth.uid()
    )
  );

-- RLS gap: orgs currently cannot read pickups, so can't discover route_id for their item.
create policy "Organisations can view pickups for own items"
  on pickups for select
  using (
    exists (
      select 1 from items
      where items.id = pickups.item_id
        and items.organisation_id = auth.uid()
    )
  );

-- Enable realtime so the org tracking page gets live volunteer-position pushes.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'routes'
  ) then
    alter publication supabase_realtime add table routes;
  end if;
end $$;

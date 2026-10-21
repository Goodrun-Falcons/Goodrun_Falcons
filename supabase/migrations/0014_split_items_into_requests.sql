-- SCRUM-81: split items into requests + request_items so an org can submit
-- multiple item types in one pickup instead of being stuck at one item per
-- request. Renaming items -> requests (rather than creating a fresh table)
-- keeps existing row ids stable, so pickups/routes/RLS/realtime keep working
-- without a data migration beyond moving item_type/quantity out.

alter table items rename to requests;
alter table requests rename constraint items_pkey to requests_pkey;
alter table requests rename constraint items_organisation_id_fkey to requests_organisation_id_fkey;
alter table requests rename constraint items_status_check to requests_status_check;

alter index idx_items_pickup_location rename to idx_requests_pickup_location;
alter index idx_items_status rename to idx_requests_status;

alter policy "Authenticated users can view items" on requests
  rename to "Authenticated users can view requests";
alter policy "Organisations can create items" on requests
  rename to "Organisations can create requests";

create table request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  item_type text not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create index idx_request_items_request_id on request_items (request_id);

insert into request_items (request_id, item_type, quantity, created_at)
select id, item_type, quantity, created_at from requests;

alter table requests drop column item_type;
alter table requests drop column quantity;

-- Delivery tag: which internal team an org's request belongs to. Orgs pick
-- it at creation; admins can change it on review. Nullable since existing
-- rows predate this field.
alter table requests add column tag text
  check (tag in (
    'animal_welfare',
    'donations',
    'education',
    'funders_and_grants',
    'humanitarian_aid',
    'innovation'
  ));

alter table request_items enable row level security;

create policy "Authenticated users can view request items"
  on request_items for select
  using (auth.role() = 'authenticated');

create policy "Organisations can create request items for own requests"
  on request_items for insert
  with check (
    exists (
      select 1 from requests
      where requests.id = request_items.request_id
        and requests.organisation_id = auth.uid()
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'request_items'
  ) then
    alter publication supabase_realtime add table request_items;
  end if;
end $$;

-- pickups.item_id pointed at items(id); rename to request_id now that it
-- points at requests(id). Existing values are untouched (ids didn't change).
alter table pickups rename column item_id to request_id;
alter table pickups rename constraint pickups_item_id_fkey to pickups_request_id_fkey;

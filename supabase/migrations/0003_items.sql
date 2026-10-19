create table items (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  created_by_admin boolean not null default false,
  item_type text not null,
  quantity integer not null default 1,
  description text,
  pickup_location extensions.geography(point, 4326) not null,
  dropoff_location extensions.geography(point, 4326),
  urgency text not null default 'medium'
    check (urgency in ('low', 'medium', 'high')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'in_transit', 'delivered')),
  created_at timestamptz not null default now()
);

create index idx_items_pickup_location on items using gist (pickup_location);
create index idx_items_status on items (status);
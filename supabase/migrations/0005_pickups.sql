create table pickups (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  route_id uuid references routes(id) on delete set null,
  status text not null default 'assigned'
    check (status in ('assigned', 'en_route', 'picked_up', 'delivered')),
  handover_photo_url text,
  handover_timestamp timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_pickups_status on pickups (status);
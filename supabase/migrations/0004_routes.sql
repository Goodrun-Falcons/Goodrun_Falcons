create table routes (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed')),
  current_location extensions.geography(point, 4326),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_routes_current_location on routes using gist (current_location);
create table volunteers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  vehicle_type text,
  service_area extensions.geography(point, 4326),
  availability jsonb,
  status text not null default 'pending_vetting'
    check (status in ('pending_vetting', 'active', 'inactive')),
  completed_trips_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_volunteers_service_area on volunteers using gist (service_area);
create table organisations (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  address text,
  location extensions.geography(point, 4326),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_organisations_location on organisations using gist (location);
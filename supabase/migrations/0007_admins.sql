create table admins (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null unique,
  created_at timestamptz not null default now()
);
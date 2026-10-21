create table signup_requests (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  address text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references admins(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table signup_requests enable row level security;

create policy "Users can create own signup request"
  on signup_requests for insert
  with check (auth.uid() = auth_user_id);

create policy "Users can view own signup request"
  on signup_requests for select
  using (auth.uid() = auth_user_id);

create policy "Admins can view all signup requests"
  on signup_requests for select
  using (exists (select 1 from admins where id = auth.uid()));

create policy "Admins can update signup requests"
  on signup_requests for update
  using (exists (select 1 from admins where id = auth.uid()));

create policy "Admins can create organisations"
  on organisations for insert
  with check (exists (select 1 from admins where id = auth.uid()));

-- Enable RLS on all tables
alter table volunteers enable row level security;
alter table organisations enable row level security;
alter table items enable row level security;
alter table routes enable row level security;
alter table pickups enable row level security;

-- Volunteers: can read/update their own row
create policy "Volunteers can view own profile"
  on volunteers for select
  using (auth.uid() = id);

create policy "Volunteers can update own profile"
  on volunteers for update
  using (auth.uid() = id);

-- Organisations: can read/update their own row
create policy "Organisations can view own profile"
  on organisations for select
  using (auth.uid() = id);

create policy "Organisations can update own profile"
  on organisations for update
  using (auth.uid() = id);

-- Items: any authenticated user can read (volunteers browsing pickups)
create policy "Authenticated users can view items"
  on items for select
  using (auth.role() = 'authenticated');

-- Items: organisations can insert their own requests
create policy "Organisations can create items"
  on items for insert
  with check (auth.uid() = organisation_id);

-- Routes: volunteers manage their own
create policy "Volunteers can view own routes"
  on routes for select
  using (auth.uid() = volunteer_id);

create policy "Volunteers can manage own routes"
  on routes for all
  using (auth.uid() = volunteer_id);

-- Pickups: volunteers manage their own
create policy "Volunteers can view own pickups"
  on pickups for select
  using (auth.uid() = volunteer_id);

create policy "Volunteers can update own pickups"
  on pickups for update
  using (auth.uid() = volunteer_id);
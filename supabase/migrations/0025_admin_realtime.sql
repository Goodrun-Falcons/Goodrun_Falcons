-- Enable realtime on the tables the admin dashboard lists, so an action by one
-- admin (approve a signup, approve a request, activate a volunteer, ...) shows
-- up on every other admin's screen without a manual refresh.

do $$
declare
  t text;
begin
  foreach t in array array[
    'signup_requests', 'organisations', 'requests', 'pickups', 'volunteers', 'support_tickets'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

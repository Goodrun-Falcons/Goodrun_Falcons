-- Enable realtime so the org-side My Requests list and request detail pages
-- get live status updates (submitted -> matched -> in transit -> delivered)
-- instead of requiring a manual refresh.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table items;
  end if;
end $$;

-- admins had RLS enabled (migration 0007) but no policies, so even an admin
-- could never read their own row — this silently broke every admin login
-- check in the web app (it does `select ... from admins where id = auth.uid()`
-- to verify admin status).

create policy "Admins can view own profile"
  on admins for select
  using (auth.uid() = id);

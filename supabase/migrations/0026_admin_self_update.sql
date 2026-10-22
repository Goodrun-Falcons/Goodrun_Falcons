-- Let an admin edit their own display name from the Settings page.
-- admins only had a SELECT policy (0011). Restrict the UPDATE grant to
-- full_name so id/email can't be changed through the API.

revoke update on admins from authenticated;
grant update (full_name) on admins to authenticated;

create policy "Admins can update own profile"
  on admins for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

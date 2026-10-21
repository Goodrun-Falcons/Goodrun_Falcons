-- admin_assign_volunteer now also records which admin made the assignment
-- (pickups.assigned_by), as the earlier client-side assign flow did.

create or replace function admin_assign_volunteer(p_request_id uuid, p_volunteer_id uuid)
returns void as $$
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'Only admins can assign volunteers';
  end if;

  if not exists (select 1 from volunteers where id = p_volunteer_id and status = 'active') then
    raise exception 'Volunteer is not active';
  end if;

  -- Mirror what the volunteer app's accept does (status + volunteer_id +
  -- accepted_at); its My Route list filters on requests.volunteer_id.
  update requests
  set status = 'accepted', volunteer_id = p_volunteer_id, accepted_at = now()
  where id = p_request_id and status = 'approved' and volunteer_id is null;

  if not found then
    raise exception 'Request is no longer awaiting a volunteer';
  end if;

  insert into pickups (request_id, volunteer_id, status, assigned_by)
  values (p_request_id, p_volunteer_id, 'assigned', auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

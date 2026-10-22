-- Admin portal gap-fill: missing RLS policies + organisations.active column.
--
-- Tables addressed: support_tickets, requests, request_items, routes,
-- pickups, volunteers, organisations.
--
-- Context: migration 0009 added admin SELECT on support_tickets but no UPDATE;
-- migration 0014 created request_items with no admin policies; routes/pickups/
-- volunteers only have own-profile policies; organisations had no admin SELECT
-- or UPDATE policy (blocking the Approve button on account-approval and
-- organisation-requests pages).

-- ── support_tickets ───────────────────────────────────────────────────────────
-- Admins can view all tickets (policy already exists in 0009).
-- Add UPDATE so admins can change status: open → in_progress → resolved.
create policy "Admins can update any support ticket"
  on support_tickets for update
  using (exists (select 1 from admins where id = auth.uid()))
  with check (exists (select 1 from admins where id = auth.uid()));

-- ── requests ──────────────────────────────────────────────────────────────────
-- "Authenticated users can view requests" (from 0014) already covers admin SELECT.
-- Add UPDATE: approve/reject requests and edit the tag field on review.
create policy "Admins can update requests"
  on requests for update
  using (exists (select 1 from admins where id = auth.uid()))
  with check (exists (select 1 from admins where id = auth.uid()));

-- ── request_items ─────────────────────────────────────────────────────────────
-- "Authenticated users can view request items" already covers admin SELECT.
-- Add UPDATE so admins can adjust item quantities during review.
create policy "Admins can update request items"
  on request_items for update
  using (exists (select 1 from admins where id = auth.uid()))
  with check (exists (select 1 from admins where id = auth.uid()));

-- ── routes ────────────────────────────────────────────────────────────────────
-- Routes previously had only volunteer own-profile policies.
create policy "Admins can view all routes"
  on routes for select
  using (exists (select 1 from admins where id = auth.uid()));

-- ── pickups ───────────────────────────────────────────────────────────────────
-- Pickups previously had only volunteer own-profile policies.
create policy "Admins can view all pickups"
  on pickups for select
  using (exists (select 1 from admins where id = auth.uid()));

-- INSERT allows admin to manually assign a volunteer by creating a pickup row.
create policy "Admins can insert pickups"
  on pickups for insert
  with check (exists (select 1 from admins where id = auth.uid()));

-- ── volunteers ────────────────────────────────────────────────────────────────
-- Previously only own-profile SELECT/UPDATE existed.
create policy "Admins can view all volunteers"
  on volunteers for select
  using (exists (select 1 from admins where id = auth.uid()));

create policy "Admins can update volunteers"
  on volunteers for update
  using (exists (select 1 from admins where id = auth.uid()))
  with check (exists (select 1 from admins where id = auth.uid()));

-- ── organisations ─────────────────────────────────────────────────────────────
-- Add active column for enable/disable of org accounts.
-- Defaults to true so all existing approved orgs remain accessible.
alter table organisations
  add column if not exists active boolean not null default true;

-- Allow admins to read all org rows (needed by organisation-requests page).
create policy "Admins can view all organisations"
  on organisations for select
  using (exists (select 1 from admins where id = auth.uid()));

-- Allow admins to update org rows (deactivate/reactivate, profile corrections,
-- and the upsert ON CONFLICT UPDATE path used during approval).
create policy "Admins can update organisations"
  on organisations for update
  using (exists (select 1 from admins where id = auth.uid()))
  with check (exists (select 1 from admins where id = auth.uid()));

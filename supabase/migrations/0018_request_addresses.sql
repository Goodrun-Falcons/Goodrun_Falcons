-- Requests only stored geocoded points, so the volunteer app had no
-- human-readable pickup / drop-off address to show. Store the address text
-- alongside the coordinates. Nullable: requests created before this
-- migration have no text, so clients should fall back gracefully.

alter table requests
  add column if not exists pickup_address text,
  add column if not exists dropoff_address text;

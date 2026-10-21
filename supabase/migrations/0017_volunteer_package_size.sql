-- Volunteer registration collects full name, email, phone, preferred package
-- size and a password; all are mandatory.
--
-- preferred_package_size (small / medium / large) was already added directly
-- to the live database (NOT NULL, default 'small'), so this is written to be
-- a no-op there and to produce the identical column on a fresh database.
-- full_name and phone were nullable; this makes them required and non-blank.
-- It fails if any existing volunteer row has them empty - fix those first.
--
-- Email already lives here as NOT NULL. The password lives in auth.users
-- (hashed by Supabase Auth, never in this table) and "confirm password" is
-- a client-side check only, so neither is stored here.

alter table volunteers add column if not exists preferred_package_size text
  not null default 'small'
  check (preferred_package_size in ('small', 'medium', 'large'));

alter table volunteers
  alter column full_name set not null,
  alter column phone set not null,
  add constraint volunteers_full_name_not_blank check (length(trim(full_name)) > 0),
  add constraint volunteers_phone_not_blank check (length(trim(phone)) > 0);

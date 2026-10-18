-- Security-question based password recovery, collected at signup. Two
-- questions are required when registering; only one correct answer is
-- needed later to reset the password - no email link involved at all.
--
-- Answers are never stored in plaintext: this trigger hashes whatever
-- comes in on security_answer_1_hash/security_answer_2_hash with
-- pgcrypto's bcrypt before the row is written, the same way Supabase
-- Auth hashes the password itself. The client sends plaintext into
-- these columns on insert, same shape as it already sends a plaintext
-- password to supabase.auth.signUp().

alter table signup_requests
  add column security_question_1 text,
  add column security_answer_1_hash text,
  add column security_question_2 text,
  add column security_answer_2_hash text;

alter table organisations
  add column security_question_1 text,
  add column security_answer_1_hash text,
  add column security_question_2 text,
  add column security_answer_2_hash text;

create or replace function hash_security_answers()
returns trigger as $$
begin
  -- On UPDATE, only re-hash a column if this statement actually changed
  -- it (vs. it just passing through unchanged from OLD, e.g. an org
  -- updating their phone number) - otherwise an already-hashed value
  -- would get hashed again and the answer would stop verifying.
  if new.security_answer_1_hash is not null
    and (tg_op = 'INSERT' or new.security_answer_1_hash is distinct from old.security_answer_1_hash) then
    new.security_answer_1_hash := extensions.crypt(
      lower(trim(new.security_answer_1_hash)), extensions.gen_salt('bf')
    );
  end if;
  if new.security_answer_2_hash is not null
    and (tg_op = 'INSERT' or new.security_answer_2_hash is distinct from old.security_answer_2_hash) then
    new.security_answer_2_hash := extensions.crypt(
      lower(trim(new.security_answer_2_hash)), extensions.gen_salt('bf')
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, extensions;

create trigger hash_signup_security_answers
  before insert on signup_requests
  for each row execute function hash_security_answers();

-- Also wired on organisations for whenever SCRUM-61 (admin approval ->
-- organisations row creation) lands, and for any future "edit security
-- questions" UI - hashing stays automatic either way.
create trigger hash_organisation_security_answers
  before insert or update on organisations
  for each row execute function hash_security_answers();

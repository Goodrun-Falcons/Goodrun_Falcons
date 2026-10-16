-- Threaded replies on support tickets. Orgs can view/reply to their own
-- tickets while the ticket is still open or in progress; once an admin
-- marks it resolved, replying is blocked server-side (not just hidden in
-- the UI), since RLS checks the ticket's current status on insert.

create table support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  sender_type text not null check (sender_type in ('org', 'admin')),
  sender_id uuid not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index idx_support_ticket_messages_ticket_id on support_ticket_messages (ticket_id);

alter table support_ticket_messages enable row level security;

create policy "Organisations can view messages on own tickets"
  on support_ticket_messages for select
  using (
    exists (
      select 1 from support_tickets
      where support_tickets.id = support_ticket_messages.ticket_id
        and support_tickets.organisation_id = auth.uid()
    )
  );

create policy "Organisations can reply to own open tickets"
  on support_ticket_messages for insert
  with check (
    sender_type = 'org'
    and sender_id = auth.uid()
    and exists (
      select 1 from support_tickets
      where support_tickets.id = support_ticket_messages.ticket_id
        and support_tickets.organisation_id = auth.uid()
        and support_tickets.status <> 'resolved'
    )
  );

create policy "Admins can view all ticket messages"
  on support_ticket_messages for select
  using (exists (select 1 from admins where id = auth.uid()));

create policy "Admins can reply to any ticket"
  on support_ticket_messages for insert
  with check (
    sender_type = 'admin'
    and sender_id = auth.uid()
    and exists (select 1 from admins where id = auth.uid())
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'support_ticket_messages'
  ) then
    alter publication supabase_realtime add table support_ticket_messages;
  end if;
end $$;

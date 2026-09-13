create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

create index idx_support_tickets_organisation_id on support_tickets (organisation_id);

alter table support_tickets enable row level security;

create policy "Organisations can create own tickets"
  on support_tickets for insert
  with check (auth.uid() = organisation_id);

create policy "Organisations can view own tickets"
  on support_tickets for select
  using (auth.uid() = organisation_id);

create policy "Admins can view all support tickets"
  on support_tickets for select
  using (exists (select 1 from admins where id = auth.uid()));

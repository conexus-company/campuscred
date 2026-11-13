-- CampusCred initial schema (pr-alvin.md section 6).

create table students (
  id uuid primary key references auth.users(id) on delete cascade,
  student_no text unique not null,          -- sample data only, e.g. 22-12345
  full_name text not null,                  -- never on chain
  email text not null,
  student_ref char(66) not null             -- 0x + keccak256(salt:student_no)
);
create table issuers (
  wallet char(42) primary key,
  display_name text not null,
  office text,
  active boolean not null default true
);
create table credentials (
  doc_hash char(66) primary key,            -- 0x + SHA-256 of the PDF
  student_id uuid references students(id),
  issuer_wallet char(42) references issuers(wallet),
  cred_type text not null check (cred_type in (
    'CERT_ENROLLMENT','CERT_GRADES','CERT_COMPLETION','CERT_GOOD_MORAL','CERT_SEMINAR','DIPLOMA','TRANSCRIPT')),
  title text not null,
  pdf_path text not null,                   -- private bucket path
  share_slug text unique not null,          -- 10 random characters
  is_public boolean not null default true,
  status text not null check (status in ('active','revoked')),
  issue_tx char(66) not null,
  revoke_tx char(66),
  revoke_reason text,
  issued_at timestamptz not null,
  revoked_at timestamptz
);
create table verifications (                -- P1, for admin counts
  id bigint generated always as identity primary key,
  doc_hash char(66) not null,
  result text not null check (result in ('valid','tampered','revoked','not_found')),
  method text not null check (method in ('qr','link','upload')),
  checked_at timestamptz not null default now()   -- no IP, no personal data
);
create table sync_state (id int primary key default 1, last_block bigint not null);

create index credentials_student_id_idx on credentials (student_id);
create index credentials_issuer_wallet_idx on credentials (issuer_wallet);

-- Row-level security (6.2). verifications and sync_state get no policies: service role only.
alter table students enable row level security;
alter table issuers enable row level security;
alter table credentials enable row level security;
alter table verifications enable row level security;
alter table sync_state enable row level security;

create policy "students read own row" on students
  for select to authenticated using (auth.uid() = id);

create policy "students read own credentials" on credentials
  for select to authenticated using (student_id = auth.uid());

create policy "issuers readable by everyone" on issuers
  for select to anon, authenticated using (true);

insert into sync_state (id, last_block) values (1, 0) on conflict (id) do nothing;

-- Private bucket for credential PDFs. No storage policies: downloads use server-made signed URLs.
insert into storage.buckets (id, name, public) values ('credentials', 'credentials', false)
  on conflict (id) do nothing;

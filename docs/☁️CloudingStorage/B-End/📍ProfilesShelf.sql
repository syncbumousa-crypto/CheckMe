-- ============================================================
-- # 🗄️ 🔖  THE PROFILES TABLE
-- # 🔤 SQL
-- # 🎯 One row per user. It keeps the name of the Drive folder they chose
-- #    and the id of their file. No user data is kept here
-- # 🔗 The id column points at the account row that the sign in service
-- #    makes. If an account is deleted, its row here goes with it
-- #    The name carries the site, because this table lives in MyTerm's
-- #    database: the free plan allows two live projects and both slots
-- #    were taken. MyTerm's own `profiles` sits beside it, untouched,
-- #    and the table name is the whole wall between the two sites. So
-- #    this file is run in the MYTERM project's SQL editor, and the day
-- #    CheckMe gets a project of its own it is run there unchanged
-- ============================================================
create table if not exists public.checkme_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  drive_folder_name text,
  drive_file_id text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- # 🛡️ 🔐  WHO MAY TOUCH WHICH ROW
-- # 🔤 SQL
-- # 🎯 Turns on row level security, then allows each user to read, add
-- #    and change their own row, and nothing else
-- # 🔗 These rules are what keeps the data safe, not the public key in the
-- #    page. With security on and no rules, the table answers nobody.
-- #    auth.uid() is the id of whoever is asking right now
-- #    A rule's name only has to be unlike the others ON ITS OWN TABLE,
-- #    so these three sit happily beside MyTerm's three of the same name
-- ============================================================
alter table public.checkme_profiles enable row level security;

create policy "read own row"
  on public.checkme_profiles for select
  using (auth.uid() = id);

create policy "add own row"
  on public.checkme_profiles for insert
  with check (auth.uid() = id);

create policy "change own row"
  on public.checkme_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

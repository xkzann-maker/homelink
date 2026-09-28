-- Jalankan di Supabase: SQL Editor -> New query -> tempel -> Run
-- (Hanya perlu kalau kamu mau data tersimpan di Supabase)

create table tasks (
  id bigint generated always as identity primary key,
  title text not null,
  assignee text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table shopping_items (
  id bigint generated always as identity primary key,
  name text not null,
  quantity text not null default '',
  bought boolean not null default false,
  created_at timestamptz not null default now()
);

create table events (
  id bigint generated always as identity primary key,
  title text not null,
  date text not null,   -- format YYYY-MM-DD
  time text not null,   -- format HH:MM
  member text not null,
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;
alter table shopping_items enable row level security;
alter table events enable row level security;

-- SEMENTARA: akses terbuka karena HomeLink belum punya fitur login.
-- Jangan simpan data pribadi yang penting sebelum login ditambahkan.
create policy "Sementara: akses terbuka tasks"
  on tasks for all to anon using (true) with check (true);
create policy "Sementara: akses terbuka shopping_items"
  on shopping_items for all to anon using (true) with check (true);
create policy "Sementara: akses terbuka events"
  on events for all to anon using (true) with check (true);

-- ===== Fitur baru: Catatan Keuangan & Check-in Keluarga =====
-- Kalau tabel sebelumnya sudah dibuat, jalankan bagian ini saja.

create table transactions (
  id bigint generated always as identity primary key,
  title text not null,
  amount bigint not null check (amount > 0),  -- dalam Rupiah
  type text not null check (type in ('income', 'expense')),
  category text not null,
  date text not null,   -- format YYYY-MM-DD
  member text not null,
  created_at timestamptz not null default now()
);

create table check_ins (
  id bigint generated always as identity primary key,
  member text not null,
  mood int not null check (mood between 1 and 5),
  note text not null default '',
  date text not null,   -- format YYYY-MM-DD
  created_at timestamptz not null default now()
);

alter table transactions enable row level security;
alter table check_ins enable row level security;

-- SEMENTARA: akses terbuka karena HomeLink belum punya fitur login.
-- Data keuangan itu sensitif: jangan isi data asli sebelum login ditambahkan.
create policy "Sementara: akses terbuka transactions"
  on transactions for all to anon using (true) with check (true);
create policy "Sementara: akses terbuka check_ins"
  on check_ins for all to anon using (true) with check (true);

-- ===== Fitur baru: Riwayat Login =====
create table login_history (
  id bigint generated always as identity primary key,
  name text not null,
  logged_at text not null,   -- waktu login, format ISO
  created_at timestamptz not null default now()
);

alter table login_history enable row level security;

-- SEMENTARA: akses terbuka (kata sandi keluarga hanya mengunci tampilan aplikasi,
-- belum mengunci database).
create policy "Sementara: akses terbuka login_history"
  on login_history for all to anon using (true) with check (true);

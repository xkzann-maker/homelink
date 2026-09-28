# HomeLink

Aplikasi manajemen keluarga: jadwal, tugas rumah, daftar belanja, catatan keuangan, check-in keluarga, dan asisten AI.
Dibuat dengan Next.js, React, TypeScript, dan Tailwind CSS.

## Cara menjalankan (3 langkah)

Butuh **Node.js versi 20 atau lebih baru** (cek dengan `node -v`).

1. Extract zip ini, lalu buka foldernya di VS Code (File → Open Folder).
2. Buka terminal di VS Code (Ctrl + `), lalu jalankan:
   ```
   npm install
   ```
3. Setelah selesai:
   ```
   npm run dev
   ```
   Buka http://localhost:3000

Selesai. Tidak perlu mengisi apa pun untuk demo.

## Login keluarga

Saat aplikasi dibuka, pengguna diminta memasukkan **nama** dan **kata sandi keluarga**.
Setiap login dicatat (siapa dan kapan) dan ditampilkan di halaman **Asisten** sebagai riwayat login.

- Kata sandi bawaan ada di `lib/auth.ts`. Untuk menggantinya, isi `HOMELINK_PASSWORD` di `.env.local` (di Vercel: Settings → Environment Variables).
- Isi juga `HOMELINK_SECRET` dengan teks acak yang panjang, supaya cookie login tidak bisa dipalsukan.
- Sesi login berlaku 7 hari. Tombol 🚪 di menu atas untuk keluar.
- Kata sandi diperiksa di server (`app/api/auth/login/route.ts`), tidak tertulis di kode browser.
- Batasan: ini pengunci sederhana untuk satu keluarga, bukan akun per orang. Nama yang diketik tidak diverifikasi, dan data di Supabase belum terkunci per pengguna.

## Mode demo (tanpa setup apa pun)

- Data contoh sudah terisi (jadwal, tugas, belanja, keuangan, check-in).
- Perubahan tersimpan di browser (localStorage), jadi tidak hilang saat di-refresh.
- Asisten AI menjawab dari data keluarga secara lokal.

Untuk mengembalikan data contoh: buka DevTools browser → Application → Local Storage → hapus semua entri yang berawalan `homelink:`, lalu refresh.

## Alur demo yang disarankan

1. **Beranda**: tunjukkan kartu ringkasan, jadwal terdekat, dan tugas.
2. **Jadwal**: tambah kegiatan baru, lalu kembali ke Beranda (angkanya ikut berubah).
3. **Tugas**: centang tugas dan lihat progress bar bergerak.
4. **Belanja**: tambah barang, centang, lalu "Hapus semua yang sudah dibeli".
5. **Keuangan**: catat pengeluaran/pemasukan, lihat saldo dan grafik kategori bulan ini.
6. **Check-in**: pilih anggota keluarga, pilih suasana hati, kirim. Kartu di Beranda ikut berubah.
7. **Asisten**: lihat kartu riwayat login, klik saran pertanyaan, atau coba perintah seperti "Tambah belanja susu 2 liter" (akan diminta konfirmasi dulu).
8. Refresh halaman untuk menunjukkan data tetap tersimpan.

## Opsional: Supabase (data permanen di database online)

1. Buat project di https://database.new
2. Di **SQL Editor**, jalankan isi file `supabase/schema.sql`.
   (Kalau kamu sudah pernah menjalankan versi lama, jalankan hanya bagian "Fitur baru" di bagian bawah file itu.)
3. Salin `.env.local.example` menjadi `.env.local`, lalu isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon key juga bisa dipakai).
4. Restart `npm run dev`. Badge di Beranda akan berubah menjadi "Data: Supabase".

Catatan: aturan akses di `schema.sql` sengaja terbuka karena belum ada fitur login. Jangan simpan data pribadi (termasuk data keuangan asli) sebelum login ditambahkan.

## Opsional: OpenAI (asisten AI sungguhan)

1. Isi `OPENAI_API_KEY` di `.env.local`. Kalau perlu, ganti nama model lewat `OPENAI_MODEL`.
2. Restart `npm run dev`.

Key hanya dipakai di server (`app/api/chat/route.ts`), tidak terlihat di browser. Dengan key ini, Asisten bisa menjawab pertanyaan apa saja, bukan hanya soal data keluarga. Kalau OpenAI gagal atau key kosong, asisten otomatis memakai jawaban lokal.

## Struktur folder

```
app/
├── page.tsx            Beranda
├── schedule/page.tsx   Jadwal
├── tasks/page.tsx      Tugas rumah
├── shopping/page.tsx   Daftar belanja
├── finance/page.tsx    Catatan keuangan
├── checkin/page.tsx    Check-in keluarga
├── assistant/page.tsx  Asisten AI
├── api/chat/route.ts   Penghubung ke OpenAI (server, wajib login)
└── api/auth/*          Login, logout, cek sesi (server)
components/Nav.tsx      Menu navigasi
components/AuthProvider.tsx  Layar login + riwayat login
lib/
├── useTable.ts         Simpan data (Supabase atau browser)
├── data.ts             Tipe data, data contoh, hook per fitur
├── assistant.ts        Konteks dan jawaban lokal asisten
├── skills.ts           Kalkulator, konversi, ide, tips, hiburan (lokal)
├── actions.ts          Perintah cepat "tambah belanja ..." (dengan konfirmasi)
├── auth.ts             Kata sandi & cookie login (server)
├── date.ts             Fungsi tanggal
└── supabase.ts         Koneksi Supabase
supabase/schema.sql     Tabel database
```

## Masalah umum

- `npm` tidak dikenali: install Node.js dari https://nodejs.org lalu buka ulang VS Code.
- Setelah mengubah `.env.local`, selalu restart `npm run dev`.
- Port 3000 terpakai: jalankan `npm run dev -- -p 3001`.

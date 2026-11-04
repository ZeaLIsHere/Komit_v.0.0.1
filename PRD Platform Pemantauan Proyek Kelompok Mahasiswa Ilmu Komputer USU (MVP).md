# PRD: Platform Pemantauan Proyek Kelompok Mahasiswa Ilmu Komputer USU (MVP)

**Versi:** 0.2 **Tanggal:** 4 November 2026 **Status:** Draft dengan keputusan teknis **Penyusun:** Tim founder (4 orang)

> Dokumen teknis lengkap tersedia di [ARCHITECTURE.md](./ARCHITECTURE.md) dan schema database di [prisma/schema.prisma](./prisma/schema.prisma).

## 1. Ringkasan

Produk ini adalah aplikasi web yang membantu dosen memantau progres dan kontribusi kelompok mahasiswa pada tugas besar berbasis pengembangan aplikasi. Sistem membaca aktivitas dari repositori GitHub secara otomatis, menampilkannya dalam dashboard, dan memberi penanda dini pada kelompok atau anggota yang tidak aktif. Mahasiswa tidak perlu menginput progres secara manual dua kali.

**Pernyataan nilai (value proposition):**

> Dosen bisa melihat dalam satu layar kelompok mana yang aktif, mana yang tertinggal, dan siapa yang berkontribusi, tanpa mahasiswa harus input data manual.

**Fokus MVP:** satu mata kuliah pilot di Program Studi Ilmu Komputer USU selama satu semester, dengan 1 dosen dan minimal 5 kelompok.

## 2. Latar Belakang dan Masalah

Tugas kelompok pada mata kuliah seperti Rekayasa Perangkat Lunak, Basis Data, Pemrograman Web, dan PBO umumnya dikerjakan di GitHub. Dosen menghadapi beberapa masalah:

- Sulit mengetahui progres nyata puluhan kelompok sekaligus. Biasanya baru ketahuan saat demo akhir.
- Sulit mengetahui siapa yang benar-benar bekerja di dalam kelompok, sehingga penilaian individu tidak adil dan masalah free-rider baru muncul lewat keluhan.
- Pemantauan manual (membuka repo satu per satu, menanyakan lewat WhatsApp) memakan waktu dan tidak konsisten.

Mahasiswa menghadapi masalah sebaliknya: kontribusi yang tidak terlihat (misalnya desain, riset, dokumentasi) tidak diakui, dan beban kerja tidak merata.

**Alternatif yang ada saat ini:** GitHub Classroom (mengelola repo tetapi minim analitik progres), Trello/Notion/GitHub Projects (manajemen tugas umum, tidak berorientasi dosen), serta pemantauan manual lewat WhatsApp dan sesi asistensi.

**Hipotesis yang harus dibuktikan oleh pilot:** dosen bersedia memakai dashboard ini secara rutin dan menganggap datanya cukup akurat untuk membantu keputusan, seperti menegur kelompok yang diam atau menyesuaikan nilai individu.

## 3. Tujuan dan Non-Tujuan

### 3.1 Tujuan MVP

1. Dosen dapat melihat status aktivitas semua kelompok dalam satu mata kuliah di satu layar.
2. Dosen dan anggota kelompok dapat melihat indikator aktivitas per anggota yang bersumber dari GitHub, dengan filter noise.
3. Dosen dapat mendefinisikan milestone dan tenggat, dan melihat milestone mana yang terlambat.
4. Dosen mendapat peringatan otomatis saat ada kelompok tidak aktif.
5. Setup per kelompok selesai kurang dari 10 menit tanpa bantuan tim kami.

### 3.2 Non-Tujuan (sengaja di luar MVP)

- Task board internal (mahasiswa tetap boleh memakai Trello atau GitHub Projects).
- Skor atau nilai kontribusi otomatis. Sistem hanya menampilkan indikator dan penanda, bukan nilai akhir.
- Peer review antar anggota (direncanakan versi 2).
- Log bimbingan skripsi/tugas akhir.
- Portofolio otomatis, chat, video call, wiki, fitur AI, gamifikasi.
- Aplikasi mobile native (web responsif sudah cukup).
- Dukungan GitLab, Bitbucket, atau Git hosting lain.
- Integrasi dengan sistem akademik kampus (SIAKAD/e-learning).

## 4. Pengguna Target

### 4.1 Persona utama: Dosen pengampu

- Mengampu 1–3 mata kuliah dengan tugas besar berkelompok, 10–40 kelompok per kelas.
- Terbiasa dengan GitHub tingkat dasar sampai menengah, tidak punya banyak waktu untuk mengecek repo satu per satu.
- Kebutuhan: gambaran cepat, peringatan dini, data pendukung saat menilai.

### 4.2 Persona sekunder: Mahasiswa anggota kelompok

- Mahasiswa Ilmu Komputer yang mengerjakan proyek dalam kelompok 3–5 orang dan sudah memakai GitHub.
- Kebutuhan: tidak ada kerja administrasi tambahan, kontribusi diakui secara adil, pengingat tenggat.
- Kekhawatiran: dipantau secara tidak adil atau datanya disalahartikan.

### 4.3 Persona tersier (pasca-MVP): Koordinator prodi/kajur

Ingin melihat ringkasan lintas mata kuliah. Tidak dilayani di MVP.

## 5. Metrik Keberhasilan

| Metrik | Target MVP | Cara mengukur |
| --- | --- | --- |
| Adopsi pilot | Minimal 1 dosen dan 5 kelompok aktif sepanjang semester | Data akun dan koneksi repo |
| Penggunaan dosen | Membuka dashboard minimal 1x per minggu tanpa diingatkan | Log akses |
| Keputusan nyata | Dosen menyebut minimal 1 keputusan yang terbantu dashboard | Wawancara akhir pilot |
| Akurasi persepsi | Mayoritas mahasiswa menilai data "cukup mewakili" | Survei akhir pilot |
| Kemudahan setup | Median waktu setup kelompok < 10 menit | Log onboarding |
| Retensi niat | Dosen bersedia memakai lagi semester depan | Wawancara akhir pilot |

**Kriteria lanjut:** minimal 3 dari 6 metrik tercapai, termasuk "keputusan nyata" dan "retensi niat". Jika dosen hanya memakai sekali lalu berhenti, tim wajib membedah penyebabnya sebelum menambah fitur.

## 6. Lingkup MVP

### 6.1 Termasuk

Autentikasi GitHub, manajemen mata kuliah dan kelompok, koneksi repo lewat GitHub App, dashboard dosen, dashboard kelompok dan anggota, pemetaan identitas, milestone sederhana, serta notifikasi email.

### 6.2 Ditunda

Peer review, skor kontribusi otomatis, task board, log bimbingan, WhatsApp notification (dipertimbangkan setelah email berjalan), ekspor laporan lanjutan, dan multi-kampus.

## 7. Kebutuhan Fungsional

Prioritas: **P0** = wajib untuk MVP, **P1** = diharapkan, **P2** = bila waktu cukup.

### 7.1 Autentikasi dan Peran

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-01 | Pengguna login dengan akun GitHub (OAuth via GitHub App) | P0 |
| F-02 | Sistem memiliki dua peran: dosen dan mahasiswa | P0 |
| F-03 | Akun dosen dibuat lewat daftar putih email/akun yang disetujui tim (MVP: manual) | P0 |
| F-04 | Mahasiswa mengisi nama lengkap dan NIM saat pertama kali masuk | P0 |
| F-05 | Pengguna dapat keluar (logout) dan menghapus akun beserta datanya atas permintaan | P1 |

**Kriteria penerimaan:** pengguna baru bisa masuk dan mencapai halaman beranda sesuai perannya dalam kurang dari 2 menit.

### 7.2 Mata Kuliah dan Kelompok

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-10 | Dosen membuat mata kuliah (nama, kode, semester, tahun ajaran) | P0 |
| F-11 | Dosen membuat kelompok secara manual atau impor CSV (nama kelompok, daftar NIM) | P0 |
| F-12 | Setiap kelompok punya kode undangan; mahasiswa bergabung dengan memasukkan kode | P0 |
| F-13 | Mahasiswa hanya dapat tergabung dalam satu kelompok per mata kuliah | P0 |
| F-14 | Dosen dapat memindahkan atau mengeluarkan anggota | P1 |
| F-15 | Dosen dapat mengarsipkan mata kuliah setelah semester berakhir | P1 |

**Kriteria penerimaan:** impor CSV berisi 40 kelompok selesai tanpa error, dan baris yang gagal dilaporkan dengan alasan yang jelas.

### 7.3 Koneksi Repositori GitHub

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-20 | Anggota kelompok (disarankan ketua) memasang GitHub App ke repo kelompok dengan izin read-only | P0 |
| F-21 | Sistem melakukan backfill riwayat commit, PR, review, dan issue saat repo pertama kali dihubungkan | P0 |
| F-22 | Sistem menerima webhook (push, pull\_request, pull\_request\_review, issues, issue\_comment) dan memperbarui data hampir real-time | P0 |
| F-23 | Satu kelompok dapat menghubungkan lebih dari satu repo (misalnya frontend dan backend) | P1 |
| F-24 | Sistem menampilkan status koneksi (terhubung, gagal, izin dicabut) beserta petunjuk perbaikan | P0 |
| F-25 | Sistem menangani rate limit GitHub dengan antrean dan percobaan ulang | P0 |

**Kriteria penerimaan:** backfill repo dengan 1.000 commit selesai dalam 5 menit. Event webhook muncul di dashboard dalam 2 menit.

### 7.4 Pemetaan Identitas

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-30 | Sistem mencocokkan author commit ke akun anggota lewat akun GitHub dan email | P0 |
| F-31 | Commit yang tidak dapat dicocokkan ditampilkan di daftar "belum terhubung" | P0 |
| F-32 | Anggota kelompok dapat memetakan nama/email commit ke anggota secara manual, dan semua perubahan pemetaan tercatat | P0 |
| F-33 | Co-author (`Co-authored-by`) ikut dihitung sebagai kontribusi | P1 |
| F-34 | Pada squash merge, kontribusi dihitung ke author PR, bukan hanya akun yang menekan tombol merge | P0 |

### 7.5 Metrik Aktivitas

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-40 | Per anggota per minggu: jumlah commit (terfilter), PR dibuka, PR di-merge, review/komentar, issue dibuat/ditutup, dan hari aktif | P0 |
| F-41 | Per kelompok per minggu: total aktivitas dan jumlah anggota yang aktif | P0 |
| F-42 | Filter noise bawaan: lockfile, `node_modules`, folder build/dist, file generated, file minified, merge commit, dan perubahan whitespace saja | P0 |
| F-43 | Dosen dapat menambah pola file yang dikecualikan per mata kuliah | P2 |
| F-44 | Anggota dapat menandai kontribusi non-kode (desain, riset, dokumentasi, testing) lewat catatan singkat yang tampil di profil kelompok | P1 |
| F-45 | Sistem **tidak** menampilkan skor atau persentase kontribusi tunggal | P0 |

### 7.6 Status Kelompok dan Peringatan

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-50 | Status kelompok dihitung otomatis: **Aktif** (ada aktivitas dalam 7 hari), **Melambat** (8–14 hari), **Tidak aktif** (lebih dari 14 hari) | P0 |
| F-51 | Ambang batas status dapat diubah dosen per mata kuliah | P1 |
| F-52 | Penanda per anggota, misalnya "tidak ada aktivitas 3 minggu" atau "aktivitas hanya di 3 hari terakhir sebelum tenggat" | P1 |
| F-53 | Email ke dosen saat kelompok masuk status Tidak aktif, dengan ringkasan mingguan opsional | P0 |
| F-54 | Kelompok tidak diberi status Tidak aktif pada periode libur yang ditandai dosen | P2 |

### 7.7 Dashboard

**Dashboard dosen**

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-60 | Daftar semua kelompok dalam mata kuliah dengan status, aktivitas terakhir, dan status milestone aktif | P0 |
| F-61 | Pengurutan dan filter (status, nama, terlambat milestone) | P0 |
| F-62 | Halaman detail kelompok: grafik aktivitas mingguan, tabel indikator per anggota, daftar PR/commit terbaru, daftar commit belum terhubung | P0 |
| F-63 | Setiap indikator menampilkan penjelasan singkat (tooltip) tentang cara menghitungnya dan keterbatasannya | P0 |
| F-64 | Ekspor data kelompok ke CSV | P2 |

**Dashboard mahasiswa**

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-65 | Mahasiswa melihat dashboard kelompoknya, termasuk indikator semua anggota (transparansi) | P0 |
| F-66 | Mahasiswa melihat milestone, tenggat, dan statusnya | P0 |

**Kriteria penerimaan:** dashboard dosen dengan 40 kelompok tampil dalam kurang dari 3 detik.

### 7.8 Milestone

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-70 | Dosen membuat milestone (judul, deskripsi, tenggat) untuk seluruh kelompok dalam mata kuliah | P0 |
| F-71 | Kelompok menandai milestone selesai dan menempelkan satu atau lebih tautan (repo, dokumen, video demo) | P0 |
| F-72 | Dosen melihat milestone mana yang selesai, belum, dan terlambat, per kelompok | P0 |
| F-73 | Dosen dapat memberi catatan singkat pada pengumpulan milestone | P1 |
| F-74 | Template milestone per jenis mata kuliah (RPL, Basis Data, Web, PBO) | P2 |

### 7.9 Notifikasi

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-80 | Email pengingat tenggat ke mahasiswa (H-3 dan H-1) | P0 |
| F-81 | Email peringatan kelompok tidak aktif ke dosen | P0 |
| F-82 | Pengguna dapat mengatur preferensi notifikasi | P1 |
| F-83 | Notifikasi WhatsApp | P2 (pasca-MVP) |

## 8. Aturan Perhitungan dan Interpretasi Data

Bagian ini penting agar produk tidak merugikan mahasiswa.

1. **Indikator, bukan penilaian.** Semua angka adalah bahan diskusi dosen dan kelompok, bukan nilai otomatis. Teks ini harus tampil jelas di antarmuka.
2. **Hari aktif** dihitung dari tanggal unik tempat anggota punya minimal satu commit, PR, atau review.
3. **Commit** dihitung setelah filter noise dan dedup (commit yang sama di beberapa branch hanya dihitung sekali).
4. **Baris kode** hanya ditampilkan sebagai informasi sekunder dan tidak dipakai dalam penanda otomatis karena mudah dimanipulasi dan menyesatkan.
5. **Review dan komentar PR** diberi bobot visual setara dengan commit karena mencerminkan kolaborasi.
6. **Keterbatasan** harus dinyatakan: kerja non-kode, pair programming, dan kerja di luar repo terhubung tidak terlihat.
7. **Force push dan penulisan ulang riwayat:** sistem menyimpan event dari webhook sebagai catatan, dan menandai repo yang riwayatnya berubah.

## 9. Alur Pengguna Utama

### 9.1 Onboarding dosen

1. Dosen login dengan GitHub, akun dikenali dari daftar putih.
2. Dosen membuat mata kuliah dan mengimpor daftar kelompok (CSV) atau membuatnya manual.
3. Dosen membagikan kode undangan ke tiap kelompok.
4. Dosen membuat milestone beserta tenggat.

### 9.2 Onboarding kelompok

1. Mahasiswa login dengan GitHub dan mengisi nama serta NIM.
2. Mahasiswa memasukkan kode undangan dan bergabung ke kelompok.
3. Satu anggota memasang GitHub App ke repo kelompok.
4. Sistem melakukan backfill dan menampilkan hasil awal, termasuk commit yang belum terhubung.
5. Anggota memetakan identitas yang belum terhubung.

### 9.3 Pemantauan mingguan oleh dosen

1. Dosen membuka dashboard, melihat kelompok berstatus Melambat dan Tidak aktif.
2. Dosen membuka detail kelompok, memeriksa indikator per anggota.
3. Dosen menghubungi kelompok di luar sistem (WhatsApp/asistensi) bila perlu.

## 10. Kebutuhan Non-Fungsional

- **Performa:** halaman utama dimuat di bawah 3 detik pada koneksi seluler Indonesia yang umum.
- **Skala awal:** mampu menangani 10 mata kuliah, 400 kelompok, dan 2.000 pengguna tanpa perubahan arsitektur.
- **Ketersediaan:** target 99% selama periode pilot (hosting terkelola, tanpa jaminan SLA formal).
- **Keandalan data:** pemrosesan webhook bersifat idempoten dan memakai antrean sehingga event tidak hilang bila server restart.
- **Keamanan:** izin GitHub read-only, token disimpan terenkripsi, kontrol akses berbasis peran, isolasi data antar mata kuliah (multi-tenancy), HTTPS, dan pencadangan database harian.
- **Responsif:** tampilan nyaman di layar laptop dan ponsel.
- **Bahasa:** antarmuka Bahasa Indonesia, struktur teks siap untuk Bahasa Inggris kelak.
- **Observabilitas:** pencatatan error dan pemantauan antrean job.

## 11. Privasi, Keamanan, dan Etika

Data mahasiswa adalah data pribadi, dan hasil pemantauan dapat memengaruhi penilaian. Prinsip yang harus dipenuhi:

- **Transparansi:** semua anggota tahu data apa yang dikumpulkan dan siapa yang bisa melihatnya. Layar persetujuan (consent) ditampilkan sebelum repo dihubungkan.
- **Minimisasi data:** hanya metadata aktivitas yang disimpan (author, waktu, jumlah perubahan, judul PR). Isi kode tidak disimpan.
- **Akses terbatas:** dosen hanya melihat mata kuliah yang diampunya. Mahasiswa hanya melihat kelompoknya.
- **Kepatuhan:** produk memproses data pribadi, sehingga kewajiban UU Pelindungan Data Pribadi (UU PDP) perlu ditinjau bersama konsultan hukum sebelum pilot. Tim bukan pihak yang dapat memberi nasihat hukum final.
- **Hak penghapusan:** data dapat dihapus atas permintaan setelah semester berakhir.
- **Pencegahan penyalahgunaan:** hindari fitur yang mendorong manipulasi (misalnya papan peringkat antar mahasiswa).
- **Persetujuan institusi:** pilot dilakukan dengan sepengetahuan dosen pengampu dan, bila perlu, prodi.

## 12. Arsitektur dan Integrasi (Tingkat Tinggi)

> Detail lengkap: [ARCHITECTURE.md](./ARCHITECTURE.md)

### Stack teknologi (diputuskan)

| Layer | Pilihan |
| --- | --- |
| Framework | Next.js 14+ (App Router, fullstack monolith) |
| Database | PostgreSQL 16 (Railway managed) |
| ORM | Prisma 5 |
| Job Queue | pg-boss 9 (queue di atas PostgreSQL, zero infra tambahan) |
| Auth | NextAuth.js v5 / Auth.js (GitHub OAuth) |
| Email | Resend |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Hosting | Railway (app + PostgreSQL satu platform) |
| Monitoring | Sentry + Railway metrics |

### Keputusan arsitektur kunci

- **Server Actions** untuk semua mutasi UI, **Route Handlers** hanya untuk webhook dan OAuth callback.
- **Server Components** query Prisma langsung, tidak perlu API layer untuk read.
- **pg-boss worker** di-bootstrap via Next.js `instrumentation.ts` — jalan saat server boot di Railway (persistent process).
- **Webhook handler** hanya validasi signature + enqueue ke pg-boss. Semua logic di job worker (idempoten, bisa retry).
- **Noise filter** pakai pattern matching pada file path dan commit message. Event tetap disimpan (`isFiltered = true`), hanya tidak dihitung di metrik.
- **Group status** di-cache di tabel Group, diperbarui oleh cron job tiap jam.
- **Agregasi mingguan** pakai kolom `week` (truncate ke Senin UTC) di ActivityEvent dengan index, bukan computed on-the-fly.
- **Identity mapping** otomatis (GitHub username/email match) + manual (UI mapping oleh anggota kelompok).
- **JWT session** (bukan database session) untuk mengurangi query per request.

### Entitas data utama

> Schema lengkap: [prisma/schema.prisma](./prisma/schema.prisma)

| Entitas | Atribut penting |
| --- | --- |
| User | id, github\_id, username, nama, NIM, email, peran |
| AllowedLecturer | github\_username, email (whitelist dosen, dicek saat login) |
| Course | id, nama, kode, semester, lecturer, ambang status, exclude patterns |
| Group | id, course\_id, nama, kode\_undangan, status (cached), last\_activity\_at |
| Membership | user\_id, group\_id, is\_leader |
| Repository | id, group\_id, github\_repo\_id, installation\_id, connection\_status, history\_rewritten |
| ActivityEvent | id, repo\_id, type, github\_author, user\_id (nullable), occurred\_at, week, sha, is\_filtered, metadata |
| IdentityMapping | repo\_id, raw\_author, user\_id, created\_by\_id |
| NonCodeContribution | membership\_id, description, week |
| Milestone | id, course\_id, title, description, due\_at |
| Submission | milestone\_id, group\_id, status, links, lecturer\_note |
| Notification | id, user\_id, type, status, sent\_at |
| NotificationPreference | user\_id, email\_group\_inactive, email\_milestone\_reminder, email\_weekly\_summary |

## 13. Asumsi, Risiko, dan Dependensi

### Asumsi

- Mahasiswa dan dosen pilot memakai GitHub untuk tugas besar.
- Minimal satu dosen bersedia menjadi pilot dan mewajibkan pemakaian sistem di mata kuliahnya.
- Biaya infrastruktur pilot masih dalam batas layanan gratis atau murah.

### Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Dosen tidak mewajibkan penggunaan, adopsi mahasiswa rendah | Tinggi | Pilot hanya dengan dosen yang berkomitmen mewajibkan, onboarding terpandu |
| Data dianggap tidak adil atau mudah dimanipulasi | Tinggi | Tampilkan indikator, bukan skor; filter noise; transparansi; kolom kontribusi non-kode |
| Identitas commit tidak terhubung | Sedang | Halaman pemetaan, panduan setup git di awal semester |
| Mahasiswa menolak karena merasa diawasi | Sedang | Consent jelas, hanya metadata, semua anggota melihat data yang sama |
| Kehilangan satu semester karena terlambat | Tinggi | Cek kalender akademik, mulai wawancara dosen sekarang |
| Rate limit atau perubahan kebijakan GitHub API | Sedang | Antrean, caching, dan pembatasan frekuensi sinkronisasi |
| Konflik atau kelelahan tim founder | Tinggi | Perjanjian founder tertulis, peran jelas, evaluasi bulanan |
| Pasar USU terlalu kecil untuk bisnis | Sedang | Rencana ekspansi ke prodi/kampus lain setelah pilot terbukti |

### Dependensi

Persetujuan dosen pilot, akses ke daftar kelompok dan jadwal tugas, pendaftaran GitHub App, tinjauan privasi/legal, dan domain email untuk Resend (bisa pakai subdomain).

## 14. Linimasa dan Pembagian Peran

| Fase | Minggu | Output |
| --- | --- | --- |
| Penemuan | 1–3 | Wawancara 3–5 dosen, 1–2 pilot terkunci, desain kasar, skema database |
| Fondasi | 3–5 | Auth, mata kuliah/kelompok, GitHub App, webhook dengan data nyata |
| Inti | 5–8 | Dashboard, metrik, filter noise, pemetaan identitas |
| Pelengkap | 8–10 | Milestone, notifikasi, uji dengan 1–2 kelompok sungguhan |
| Pilot | 10–12 | Pilot di satu mata kuliah, perbaikan bug, pengumpulan feedback |

**Peran tim:**

- **Orang 1 (backend/integrasi):** GitHub App, webhook, backfill, logika metrik.
- **Orang 2 (frontend):** dashboard dosen dan halaman kelompok.
- **Orang 3 (produk/UX dan sales):** wawancara dosen, desain alur, pilot, feedback, pemegang peran "suara pelanggan".
- **Orang 4 (fleksibel):** auth, mata kuliah/kelompok, milestone, notifikasi, QA, dokumentasi.

## 15. Pertanyaan Terbuka

1. Apakah dosen di Ilmu Komputer USU sudah memakai GitHub Classroom, atau repo biasa?
2. Siapa yang berwenang menyetujui pemakaian data mahasiswa (dosen, prodi, fakultas)?
3. Apakah mahasiswa akan diminta menyetujui pemantauan secara eksplisit, dan bagaimana bentuk consent yang tepat?
4. Apakah dosen ingin ekspor data untuk keperluan penilaian, dan dalam format apa?
5. Kapan semester berikutnya dimulai, dan kapan dosen perlu memutuskan mata kuliah pilot?
6. Apa tujuan jangka panjang tim: bisnis atau proyek untuk kampus? Ini memengaruhi model harga dan prioritas ekspansi.
7. Siapa yang menanggung biaya infrastruktur selama pilot?

## 16. Rencana Pasca-MVP (Versi 2)

Prioritas awal setelah pilot, bergantung pada feedback: peer review antar anggota yang anonim, notifikasi WhatsApp, template milestone per mata kuliah, dukungan banyak repo yang lebih matang, ringkasan lintas mata kuliah untuk koordinator prodi, serta log bimbingan tugas akhir sebagai produk terpisah.

## 17. Lampiran: Definisi Selesai (Definition of Done) MVP

MVP dianggap siap pilot bila:

- Seluruh kebutuhan P0 berjalan di lingkungan produksi dan lolos uji dengan minimal 2 kelompok nyata.
- Layar consent dan penjelasan metrik sudah tampil.
- Pemantauan error dan pencadangan database aktif.
- Dokumen panduan singkat untuk dosen dan mahasiswa tersedia.
- Tinjauan privasi/legal awal sudah dilakukan.

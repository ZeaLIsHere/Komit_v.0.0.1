# AGENTS.md — Komit Platform

## Proyek

Platform web pemantauan proyek kelompok mahasiswa. Baca [PRD](./PRD%20Platform%20Pemantauan%20Proyek%20Kelompok%20Mahasiswa%20Ilmu%20Komputer%20USU%20(MVP).md) dan [ARCHITECTURE.md](./ARCHITECTURE.md) sebelum mulai kerja.

## Stack

- Next.js 14+ (App Router), TypeScript strict
- PostgreSQL 16, Prisma 5 (schema di `prisma/schema.prisma`)
- pg-boss 9 (job queue)
- NextAuth.js v5 (Auth.js) — GitHub OAuth
- Tailwind CSS 3 + shadcn/ui
- Resend (email transaksional)
- React Email (template email)

## Konvensi Kode

### Umum

- TypeScript strict mode. Tidak boleh `any` kecuali type dari library external yang memang `any`.
- Semua file pakai named export, bukan default export (kecuali page.tsx dan layout.tsx yang wajib default export oleh Next.js).
- Import pakai path alias `@/` yang merujuk ke `src/`.
- Nama file: kebab-case. Nama komponen: PascalCase. Nama fungsi/variabel: camelCase.
- Bahasa di kode (variabel, fungsi, komentar): **Inggris**. Bahasa di UI (label, teks, placeholder, tooltip): **Indonesia**.

### Server Actions

- Semua server action ada di `src/actions/`.
- Setiap action dimulai dengan otorisasi: `requireLecturer()`, `requireMember()`, atau `requireAuth()`.
- Return type konsisten: `{ success: true, data: T }` atau `{ success: false, error: string }`.
- Validasi input pakai Zod. Schema validasi di file yang sama dengan action.

### Route Handlers

- Hanya untuk endpoint external: webhook GitHub, callback OAuth.
- Lokasi: `src/app/api/`.

### Data Fetching

- Server Components query Prisma langsung via fungsi di `src/lib/queries/` atau inline.
- Tidak ada API route untuk read internal.

### Komponen

- `src/components/ui/` — shadcn/ui saja, jangan edit manual.
- `src/components/dashboard/` — komponen khusus dashboard.
- `src/components/forms/` — komponen form.
- `src/components/layout/` — sidebar, nav, consent banner.
- Komponen yang hanya dipakai di 1 page boleh di-colocate di folder page yang sama (file `_components/`).

### Job Workers

- Semua job handler di `src/lib/jobs/`.
- Setiap handler harus idempoten — bisa dijalankan ulang tanpa efek samping ganda.
- Job yang gagal di-retry 3x oleh pg-boss (default). Tidak perlu retry logic manual.

### Database

- Jangan edit `prisma/schema.prisma` tanpa diskusi dulu. Schema adalah kontrak bersama.
- Semua query yang dipakai lebih dari 1 tempat masuk ke `src/lib/queries/`.
- Raw SQL boleh hanya untuk agregasi kompleks yang Prisma tidak support efisien.

### Testing

- Prioritas test: job handlers > server actions > utility functions.
- Tidak perlu test komponen UI di MVP.

---

## Batas Domain (Boundary Rules)

Aturan ini wajib dipatuhi agar tidak ada pekerjaan yang overlap antar task.

### TASK-01: Project Setup & Shared Infrastructure

**Boleh tulis:**
- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.example`, `.gitignore`
- `prisma/schema.prisma` (sudah ada, hanya adjust jika perlu saat setup)
- `src/lib/db.ts` (Prisma client singleton)
- `src/lib/worker.ts` (pg-boss setup + schedule, TANPA handler logic)
- `src/instrumentation.ts`
- `src/app/layout.tsx` (root layout: font, metadata, provider wrapper)
- `src/middleware.ts` (auth redirect skeleton — cek session, redirect ke login/onboarding)
- `src/components/ui/` (install shadcn/ui components)
- `src/lib/week.ts` (week truncation utility)

**Tidak boleh tulis:** halaman apapun, server action apapun, job handler apapun, komponen dashboard/form apapun.

---

### TASK-02: Auth & Onboarding

**Boleh tulis:**
- `src/lib/auth.ts` (NextAuth config, GitHub provider, callback logic, whitelist check)
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/(auth)/login/page.tsx` dan komponen login
- `src/app/(auth)/onboarding/page.tsx` dan komponen onboarding
- `src/actions/auth.ts` (completeProfile action)
- Update `src/middleware.ts` — tambah logic cek profil lengkap → redirect onboarding

**Tidak boleh tulis:** halaman dashboard, server action selain `auth.ts`, komponen selain yang di `(auth)/`.

**Kontrak keluar:** session tersedia via `auth()` dari `src/lib/auth.ts`, return `{ user: { id, role, githubId, name } }`.

---

### TASK-03: Course & Group Management

**Boleh tulis:**
- `src/actions/course.ts` (createCourse, archiveCourse, updateThresholds, updateExcludePatterns)
- `src/actions/group.ts` (createGroup, importCSV, joinGroup, removeMember, moveMember)
- `src/app/(dashboard)/courses/page.tsx` — daftar mata kuliah
- `src/app/(dashboard)/courses/new/page.tsx` — form buat mata kuliah
- `src/app/(dashboard)/courses/[courseId]/settings/page.tsx` — pengaturan threshold & patterns
- `src/app/(dashboard)/groups/join/page.tsx` — mahasiswa join via invite code
- `src/app/(dashboard)/courses/[courseId]/groups/import/page.tsx` — CSV import
- `src/components/forms/course-form.tsx`
- `src/components/forms/csv-upload.tsx`

**Tidak boleh tulis:** halaman detail kelompok (`[groupId]/page.tsx`), halaman milestone, dashboard dosen (`courses/[courseId]/page.tsx`), komponen dashboard, job handler.

**Kontrak keluar:** Course dan Group tersedia di database. `inviteCode` di-generate saat create group.

---

### TASK-04: GitHub Integration (App, Webhook, Backfill)

**Boleh tulis:**
- `src/lib/github.ts` (GitHub API helpers: generate installation token, fetch commits/PRs/issues, verify webhook signature)
- `src/app/api/github/webhook/route.ts` (webhook receiver: verify + enqueue)
- `src/app/api/github/callback/route.ts` (installation callback: save repo)
- `src/actions/repository.ts` (connectRepo, disconnectRepo)
- `src/lib/jobs/backfill.ts` (backfill job handler)
- `src/lib/jobs/process-webhook.ts` (webhook event processing job handler)
- `src/lib/noise-filter.ts` (noise pattern matching logic)
- `src/lib/identity.ts` (auto identity mapping logic)
- Halaman/komponen consent saat connect repo — colocate di `src/app/(dashboard)/courses/[courseId]/groups/[groupId]/_components/connect-repo.tsx`

**Tidak boleh tulis:** halaman detail kelompok (`[groupId]/page.tsx`), dashboard, milestone, notifikasi, compute-status job. Tidak boleh tulis `src/lib/worker.ts` (sudah di TASK-01, hanya import handler dari sini).

**Kontrak keluar:** ActivityEvent rows tersedia di database setelah backfill/webhook. Field `isFiltered` dan `userId` (nullable) sudah di-set. Fungsi `autoMapIdentity(event)` di-export dari `src/lib/identity.ts`.

**Kontrak masuk:** pg-boss instance dari `src/lib/worker.ts`. Prisma client dari `src/lib/db.ts`. Week utility dari `src/lib/week.ts`.

---

### TASK-05: Identity Mapping UI

**Boleh tulis:**
- `src/app/(dashboard)/courses/[courseId]/groups/[groupId]/mapping/page.tsx`
- `src/actions/identity.ts` (mapIdentity, unmapIdentity)
- Komponen terkait mapping — colocate di `mapping/_components/`

**Tidak boleh tulis:** `src/lib/identity.ts` (auto-mapping, milik TASK-04), halaman detail kelompok, dashboard, noise filter.

**Kontrak masuk:** ActivityEvent dengan `userId = null` bisa di-query. `IdentityMapping` model tersedia.

---

### TASK-06: Dashboard Dosen

**Boleh tulis:**
- `src/app/(dashboard)/courses/[courseId]/page.tsx` — dashboard utama dosen (daftar kelompok, status, filter, sort)
- `src/app/(dashboard)/layout.tsx` — dashboard layout (sidebar, nav)
- `src/app/(dashboard)/page.tsx` — redirect ke `/courses`
- `src/components/dashboard/group-card.tsx`
- `src/components/dashboard/group-table.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/nav.tsx`
- `src/lib/queries/course-dashboard.ts` (query functions untuk dashboard dosen)

**Tidak boleh tulis:** halaman detail kelompok, halaman milestone, server actions, job handlers, komponen form.

**Kontrak masuk:** `Group.status` sudah di-cache. `Group.lastActivityAt` tersedia. Milestone + Submission joinable.

---

### TASK-07: Group Detail & Metrics

**Boleh tulis:**
- `src/app/(dashboard)/courses/[courseId]/groups/[groupId]/page.tsx` — detail kelompok (grafik aktivitas, tabel indikator anggota, PR/commit terbaru, commit belum terhubung)
- `src/components/dashboard/activity-chart.tsx`
- `src/components/dashboard/member-indicators.tsx`
- `src/lib/metrics.ts` (aggregation queries: per anggota per minggu, per kelompok per minggu)
- `src/lib/queries/group-detail.ts`
- `src/actions/contribution.ts` (addNonCodeContribution)
- Tooltip penjelasan metrik (F-63)

**Tidak boleh tulis:** dashboard dosen (courses/[courseId]/page.tsx), identity mapping page, milestone page, noise filter logic, job handlers.

**Kontrak masuk:** ActivityEvent tersedia dengan `week`, `isFiltered`, `userId`. Noise filter sudah jalan di TASK-04. Identity mapping (auto dari TASK-04, manual dari TASK-05) sudah set `userId`.

---

### TASK-08: Milestone & Submission

**Boleh tulis:**
- `src/app/(dashboard)/courses/[courseId]/milestones/page.tsx` — daftar milestone
- `src/app/(dashboard)/courses/[courseId]/milestones/new/page.tsx` — buat milestone
- `src/actions/milestone.ts` (createMilestone, submitMilestone, addLecturerNote)
- `src/components/forms/milestone-form.tsx`
- `src/components/dashboard/milestone-tracker.tsx`
- `src/lib/jobs/check-late.ts` (cron job: update PENDING → LATE jika lewat tenggat)
- `src/lib/queries/milestone.ts`

**Tidak boleh tulis:** dashboard dosen, detail kelompok, notifikasi email (reminder di TASK-09), job selain `check-late.ts`.

**Kontrak keluar:** Submission rows tersedia. `check-late` job handler di-export untuk register di worker.

---

### TASK-09: Notifikasi & Email

**Boleh tulis:**
- `src/lib/jobs/send-notification.ts` (generic email sender via Resend)
- `src/lib/jobs/compute-status.ts` (cron: compute group status, trigger alert saat INACTIVE)
- `src/lib/jobs/milestone-reminder.ts` (cron: kirim reminder H-3 dan H-1)
- `src/lib/jobs/weekly-summary.ts` (cron: ringkasan mingguan ke dosen)
- `src/emails/group-inactive.tsx`
- `src/emails/milestone-reminder.tsx`
- `src/emails/weekly-summary.tsx`
- `src/actions/notification.ts` (updatePreferences)
- `src/app/(dashboard)/settings/page.tsx` — notification preferences
- `src/lib/queries/notification.ts`

**Tidak boleh tulis:** dashboard, detail kelompok, milestone page, webhook handler, backfill.

**Kontrak masuk:** `Group.status` field ada (di-update oleh `compute-status` yang ada di task ini). `Milestone` dan `Submission` rows tersedia dari TASK-08. `NotificationPreference` model tersedia.

---

### TASK-10: Landing Page & Polish

**Boleh tulis:**
- `src/app/page.tsx` — landing page
- `src/components/layout/consent-banner.tsx`
- Komponen landing page — colocate di `src/app/_components/`
- `public/` assets (logo, favicon, og-image)
- Responsive fixes di komponen yang sudah ada (CSS/className saja, bukan logic)

**Tidak boleh tulis:** logic baru di server actions, job handlers, lib, atau halaman dashboard.

---

## Dependency Antar Task

```
TASK-01 (Setup)
  ├── TASK-02 (Auth) ← butuh middleware, db, provider
  │     └── TASK-03 (Course/Group) ← butuh session/auth
  │     └── TASK-06 (Dashboard Dosen) ← butuh session/auth, layout
  ├── TASK-04 (GitHub Integration) ← butuh db, worker, week util
  │     └── TASK-05 (Identity Mapping UI) ← butuh ActivityEvent data
  │     └── TASK-07 (Group Detail) ← butuh ActivityEvent + metrics
  ├── TASK-08 (Milestone) ← butuh db, auth
  │     └── TASK-09 (Notifikasi) ← butuh milestone data, group status
  └── TASK-10 (Landing Page) ← bisa paralel kapan saja
```

Task yang bisa paralel setelah TASK-01 + TASK-02 selesai:
- TASK-03, TASK-04, TASK-08, TASK-10 (independen)
- TASK-06 bisa mulai setelah TASK-03
- TASK-05, TASK-07 bisa mulai setelah TASK-04
- TASK-09 bisa mulai setelah TASK-08

---

## Aturan Umum

1. **Jangan melewati boundary.** Jika butuh sesuatu dari task lain, pakai kontrak (import function/type yang sudah di-export). Jangan copy-paste atau reimplementasi.
2. **Jangan edit file milik task lain.** Jika perlu perubahan di file task lain, buat issue/catatan dan selesaikan di task yang memiliki file itu.
3. **Schema database adalah kontrak bersama.** Jangan edit `prisma/schema.prisma` tanpa diskusi. Jika butuh field baru, dokumentasikan kebutuhan dan diskusikan.
4. **Setiap task harus bisa di-test independen.** Setelah selesai, fitur yang dibangun harus bisa diverifikasi tanpa harus menunggu task lain selesai (kecuali dependency eksplisit).
5. **Satu PR per task.** Jangan campur pekerjaan lintas task dalam satu PR.
6. **Selalu commit dan push.** Setiap kali ada perubahan besar atau selesai membangun fitur/task baru, wajib commit dan push ke repositori GitHub.

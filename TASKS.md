# TASKS.md — Komit Platform

> Setiap task punya boundary ketat. Lihat [AGENTS.md](./AGENTS.md) untuk aturan batas domain.
> Dependency graph di bagian bawah dokumen ini.

---

## TASK-01: Project Setup & Shared Infrastructure

**Prioritas:** P0 — harus selesai pertama
**Estimasi:** 0.5 hari
**PRD refs:** —

### Deliverables

- [x] `npx create-next-app` dengan App Router, TypeScript strict, Tailwind, `src/` directory
- [x] Install dependencies: `prisma`, `@prisma/client`, `pg-boss`, `next-auth@beta`, `@auth/prisma-adapter`, `resend`, `zod`, `@react-email/components`
- [x] `prisma/schema.prisma` sudah ada — jalankan `npx prisma generate`
- [x] `src/lib/db.ts` — Prisma client singleton (global caching untuk dev hot reload)
- [x] `src/lib/worker.ts` — pg-boss instance + schedule cron jobs + register handler imports (handler logic di task lain)
- [x] `src/lib/week.ts` — `truncateToWeek(date: Date): Date` → Senin 00:00 UTC
- [x] `src/instrumentation.ts` — bootstrap pg-boss saat `NEXT_RUNTIME === 'nodejs'`
- [x] `src/app/layout.tsx` — root layout: Inter font, metadata, `<html lang="id">`
- [x] `src/middleware.ts` — skeleton: cek session, redirect unauthenticated ke `/login`
- [x] Install shadcn/ui (`npx shadcn-ui@latest init`) + komponen dasar: Button, Input, Card, Dialog, Table, Select, Badge, Tooltip, Dropdown Menu, Sheet, Tabs
- [x] `.env.example` dengan semua env vars yang dibutuhkan
- [x] `next.config.mjs` — `experimental.instrumentationHook: true`
- [x] `.gitignore` — Node, Next.js, .env, prisma generated

### Acceptance criteria

- `npm run build` sukses tanpa error
- `npx prisma generate` sukses
- shadcn/ui components importable

---

## TASK-02: Auth & Onboarding

**Prioritas:** P0
**Estimasi:** 1 hari
**Depends on:** TASK-01
**PRD refs:** F-01, F-02, F-03, F-04, F-05

### Deliverables

- [x] `src/lib/auth.ts` — NextAuth config:
  - GitHub OAuth provider
  - Callback: upsert User, cek AllowedLecturer → auto-assign LECTURER role
  - JWT strategy, token berisi `userId`, `role`, `githubId`, `name`
  - Helper: `auth()`, `requireAuth()`, `requireLecturer(courseId)`, `requireMember(groupId)`
- [x] `src/app/api/auth/[...nextauth]/route.ts` — NextAuth route handler
- [x] `src/app/(auth)/login/page.tsx` — halaman login:
  - Logo/nama app
  - Tombol "Masuk dengan GitHub"
  - Redirect ke dashboard jika sudah login
- [x] `src/app/(auth)/onboarding/page.tsx` — halaman onboarding mahasiswa:
  - Form: nama lengkap (wajib), NIM (wajib, validasi format)
  - Submit → `completeProfile` action
  - Redirect ke dashboard setelah selesai
  - Dosen skip onboarding (sudah punya nama dari GitHub)
- [x] `src/actions/auth.ts`:
  - `completeProfile({ name, nim })` — validasi Zod, update User, NIM unik
- [x] Update `src/middleware.ts`:
  - Session ada, profil belum lengkap (`name === null` dan `role === STUDENT`) → redirect `/onboarding`
  - Session ada, profil lengkap → lanjut
  - Route `/login` dan `/onboarding` accessible tanpa redirect loop

### Acceptance criteria

- Login GitHub → redirect ke onboarding (mahasiswa) atau dashboard (dosen)
- Onboarding → isi nama + NIM → redirect ke dashboard
- Route dashboard tanpa session → redirect ke login
- Dosen di AllowedLecturer otomatis dapat role LECTURER

---

## TASK-03: Course & Group Management

**Prioritas:** P0
**Estimasi:** 2 hari
**Depends on:** TASK-02
**PRD refs:** F-10, F-11, F-12, F-13, F-14, F-15

### Deliverables

- [ ] `src/actions/course.ts`:
  - `createCourse({ name, code, semester })` — validasi Zod, `requireAuth()` + role LECTURER
  - `archiveCourse(courseId)` — `requireLecturer(courseId)`, set `archived = true`
  - `updateThresholds(courseId, { slow, inactive })` — validasi: slow < inactive
  - `updateExcludePatterns(courseId, patterns: string[])` — validasi glob pattern
- [ ] `src/actions/group.ts`:
  - `createGroup(courseId, { name })` — generate `inviteCode`, `requireLecturer`
  - `importCSV(courseId, csvContent: string)` — parse CSV, buat groups + pending memberships, return hasil per baris
  - `joinGroup(inviteCode)` — `requireAuth()`, cek role STUDENT, cek belum di kelompok lain di course yang sama (F-13), buat Membership
  - `removeMember(groupId, userId)` — `requireLecturer`, hapus Membership
  - `moveMember(fromGroupId, toGroupId, userId)` — `requireLecturer`, atomic: hapus + buat Membership
- [ ] `src/app/(dashboard)/courses/page.tsx` — daftar mata kuliah dosen:
  - Query courses by lecturerId
  - Card per course: nama, kode, semester, jumlah kelompok, badge archived
  - Tombol "Buat Mata Kuliah"
  - Mahasiswa: tampilkan courses dari membership → group → course
- [ ] `src/app/(dashboard)/courses/new/page.tsx`:
  - Form: nama, kode, semester (dropdown), tahun ajaran
  - Submit → createCourse → redirect ke course detail
- [ ] `src/app/(dashboard)/courses/[courseId]/settings/page.tsx`:
  - Form threshold: `slowThreshold`, `inactiveThreshold` (number input, hari)
  - Form exclude patterns: textarea, satu pattern per baris
  - Tombol arsipkan mata kuliah (dengan konfirmasi)
- [ ] `src/app/(dashboard)/groups/join/page.tsx`:
  - Input kode undangan
  - Submit → joinGroup → redirect ke course/group detail
  - Error handling: kode salah, sudah di kelompok lain
- [ ] `src/app/(dashboard)/courses/[courseId]/groups/import/page.tsx`:
  - Upload CSV atau paste content
  - Preview sebelum import
  - Tampilkan hasil: berhasil, gagal (dengan alasan per baris)
- [ ] `src/components/forms/course-form.tsx` — reusable form component
- [ ] `src/components/forms/csv-upload.tsx` — CSV upload + preview component

### Acceptance criteria

- Dosen buat course → muncul di daftar
- Import CSV 40 kelompok → semua terbuat, error dilaporkan per baris
- Mahasiswa join via kode → masuk kelompok
- Mahasiswa coba join kelompok lain di course sama → ditolak (F-13)
- Dosen pindahkan anggota → membership berpindah atomik

---

## TASK-04: GitHub Integration (App, Webhook, Backfill)

**Prioritas:** P0
**Estimasi:** 3 hari
**Depends on:** TASK-01
**PRD refs:** F-20, F-21, F-22, F-23, F-24, F-25, F-30, F-31, F-33, F-34, F-42

### Deliverables

- [ ] `src/lib/github.ts`:
  - `generateInstallationToken(installationId)` — POST /app/installations/{id}/access_tokens, cache sampai expiry
  - `fetchCommits(token, owner, repo, options)` — paginate, return normalized data
  - `fetchPullRequests(token, owner, repo)` — include reviews
  - `fetchIssues(token, owner, repo)` — filter out PRs
  - `verifyWebhookSignature(body, signature, secret)` — HMAC-SHA256
  - Rate limit handler: cek `X-RateLimit-Remaining`, return `retryAfter` jika habis
- [ ] `src/app/api/github/webhook/route.ts`:
  - `export const runtime = 'nodejs'`
  - Read raw body, verify signature → 401 jika gagal
  - Lookup Repository by installationId → 200 ignore jika tidak ditemukan
  - Enqueue `process-webhook-event` job → return 200
  - Handle events: `push`, `pull_request`, `pull_request_review`, `issues`, `issue_comment`
- [ ] `src/app/api/github/callback/route.ts`:
  - Handle `installation_id` + `setup_action` params
  - Fetch repo list dari GitHub API
  - Redirect ke halaman consent/connect di frontend
- [ ] `src/actions/repository.ts`:
  - `connectRepo(groupId, { installationId, githubRepoId, fullName })` — buat Repository row, enqueue backfill job
  - `disconnectRepo(repoId)` — update status REVOKED, tidak hapus data
- [ ] `src/lib/jobs/backfill.ts`:
  - Fetch commits (paginate, max 1000) → buat ActivityEvent per commit
  - Fetch PRs (all states) → PR_OPENED, PR_MERGED events + reviews
  - Fetch issues → ISSUE_OPENED, ISSUE_CLOSED events
  - Per event: set `week` via `truncateToWeek()`, jalankan noise filter, jalankan auto identity mapping
  - Update `Repository.backfillDoneAt`, `Group.lastActivityAt`
  - Rate limit: cek remaining, reschedule job jika < 10
- [ ] `src/lib/jobs/process-webhook.ts`:
  - Switch by event type, buat ActivityEvent rows
  - `push` → per commit: dedup via SHA unique constraint
  - `pull_request` → opened/merged, squash merge attribution ke PR author (F-34)
  - `pull_request_review` → PR_REVIEW event
  - `issues` → opened/closed
  - `issue_comment` → PR_COMMENT atau ISSUE_COMMENT
  - Co-authored-by parsing (F-33)
  - Per event: noise filter + auto identity mapping + update lastActivityAt
- [ ] `src/lib/noise-filter.ts`:
  - `isNoiseEvent(event, commitFiles, excludePatterns): boolean`
  - Built-in patterns: lockfiles, node_modules, dist, build, .next, vendor, minified, generated, map files
  - Message patterns: merge commits, initial commit, bot commits
  - Logic: jika SEMUA file di commit cocok pattern → noise. Sebagian → bukan noise.
- [ ] `src/lib/identity.ts`:
  - `autoMapIdentity(event): string | null` — return userId jika cocok
  - Match order: GitHub username → email → existing IdentityMapping
  - Export untuk dipakai dari backfill dan webhook processing
- [ ] `src/app/(dashboard)/courses/[courseId]/groups/[groupId]/_components/connect-repo.tsx`:
  - Consent screen: penjelasan data yang dikumpulkan
  - Tombol "Hubungkan Repository" → redirect ke GitHub App install
  - Status koneksi: terhubung/gagal/dicabut (F-24)
  - Petunjuk perbaikan jika status gagal

### Acceptance criteria

- Install GitHub App → repo terhubung, backfill jalan
- Backfill 1000 commit selesai < 5 menit (F-21 acceptance)
- Push ke repo → webhook → event muncul di DB < 2 menit
- Merge commit dan lockfile terfilter (isFiltered = true)
- Squash merge diatribusikan ke PR author
- Rate limit → job di-reschedule, tidak crash

---

## TASK-05: Identity Mapping UI

**Prioritas:** P0
**Estimasi:** 1 hari
**Depends on:** TASK-04
**PRD refs:** F-30, F-31, F-32

### Deliverables

- [ ] `src/app/(dashboard)/courses/[courseId]/groups/[groupId]/mapping/page.tsx`:
  - Daftar rawAuthor yang `userId = mokenull` (commit belum terhubung) — F-31
  - Per rawAuthor: dropdown pilih anggota kelompok
  - Tampilkan jumlah event yang akan ter-remap
  - Sudah terpetakan: daftar mapping yang ada, tombol hapus
- [ ] `src/actions/identity.ts`:
  - `mapIdentity(repoId, rawAuthor, targetUserId)`:
    - `requireMember` (anggota kelompok yang repo-nya)
    - Upsert IdentityMapping
    - Batch update semua ActivityEvent dengan `githubAuthor = rawAuthor` di repo itu → set `userId`
    - Log `createdById` (F-32: perubahan tercatat)
  - `unmapIdentity(mappingId)`:
    - `requireMember`
    - Hapus IdentityMapping
    - Batch update ActivityEvent → set `userId = null`
- [ ] `mapping/_components/`:
  - `unmapped-list.tsx` — tabel rawAuthor belum terhubung
  - `mapping-table.tsx` — tabel mapping yang sudah ada
  - `member-select.tsx` — dropdown anggota kelompok

### Acceptance criteria

- Commit belum terhubung muncul di daftar
- Pilih anggota → semua event dari rawAuthor itu ter-atribusikan
- Hapus mapping → event kembali ke `userId = null`
- Perubahan mapping tercatat (createdById)

---

## TASK-06: Dashboard Dosen

**Prioritas:** P0
**Estimasi:** 2 hari
**Depends on:** TASK-02, TASK-03
**PRD refs:** F-60, F-61

### Deliverables

- [ ] `src/app/(dashboard)/layout.tsx` — dashboard layout:
  - Sidebar: daftar courses, link settings, user info
  - Top nav: nama course aktif, tombol logout
  - Responsive: sidebar collapsible di mobile
- [ ] `src/app/(dashboard)/page.tsx`:
  - LECTURER: redirect ke `/courses`
  - STUDENT: redirect ke course/group dari membership
- [ ] `src/app/(dashboard)/courses/[courseId]/page.tsx` — dashboard utama dosen:
  - Daftar semua kelompok dalam course
  - Per kelompok: nama, status (badge warna), lastActivityAt, jumlah anggota, milestone aktif
  - Filter: by status (Aktif/Melambat/Tidak Aktif), by nama
  - Sort: by status, by nama, by lastActivityAt, by milestone terlambat
  - Klik kelompok → ke detail kelompok
- [ ] `src/components/dashboard/group-card.tsx`:
  - Card view: status badge, aktivitas terakhir, member count, milestone progress
- [ ] `src/components/dashboard/group-table.tsx`:
  - Table view: sortable columns
  - Toggle antara card view dan table view
- [ ] `src/components/layout/sidebar.tsx`
- [ ] `src/components/layout/nav.tsx`
- [ ] `src/lib/queries/course-dashboard.ts`:
  - `getCourseWithGroups(courseId)` — groups + status + lastActivityAt + member count + milestone progress
  - Satu query efisien, bukan N+1

### Acceptance criteria

- 40 kelompok tampil dalam < 3 detik (F-63 acceptance)
- Filter dan sort bekerja
- Status badge: hijau (Aktif), kuning (Melambat), merah (Tidak Aktif)
- Responsive: usable di mobile

---

## TASK-07: Group Detail & Metrics

**Prioritas:** P0
**Estimasi:** 2.5 hari
**Depends on:** TASK-04
**PRD refs:** F-40, F-41, F-44, F-45, F-62, F-63, F-65, F-66

### Deliverables

- [ ] `src/app/(dashboard)/courses/[courseId]/groups/[groupId]/page.tsx`:
  - Grafik aktivitas mingguan kelompok (bar chart) — F-62
  - Tabel indikator per anggota: commits, PRs opened/merged, reviews, issues, active days — F-40
  - Daftar PR/commit terbaru (5–10 item)
  - Daftar commit belum terhubung (link ke mapping page) — F-31
  - Kontribusi non-kode — F-44
  - Akses: LECTURER (owner course) ATAU MEMBER (kelompok ini) — F-65
  - Mahasiswa dan dosen lihat data yang sama (transparansi)
- [ ] `src/components/dashboard/activity-chart.tsx`:
  - Bar chart: total events per minggu, stacked by type
  - Library: recharts (sudah include di shadcn/ui charts)
  - Tooltip per bar: breakdown per event type
- [ ] `src/components/dashboard/member-indicators.tsx`:
  - Tabel per anggota per minggu
  - Setiap indikator punya tooltip penjelasan (F-63): cara hitung + keterbatasan
  - Penanda anggota: "tidak ada aktivitas X minggu" (F-52)
  - Non-code contributions inline
- [ ] `src/lib/metrics.ts`:
  - `getMemberMetrics(groupId, weeks?)` — per anggota per minggu (raw SQL untuk efisiensi)
  - `getGroupMetrics(groupId, weeks?)` — per kelompok per minggu
  - `getRecentActivity(groupId, limit)` — PR/commit terbaru
  - `getUnmappedCount(groupId)` — jumlah event tanpa userId
- [ ] `src/lib/queries/group-detail.ts`:
  - `getGroupDetail(groupId)` — group + members + repos + connection status
- [ ] `src/actions/contribution.ts`:
  - `addNonCodeContribution(groupId, { description })` — `requireMember`, buat NonCodeContribution, week = current week

### Acceptance criteria

- Grafik aktivitas tampil dengan data dari ActivityEvent
- Tabel per anggota menunjukkan metrik mingguan
- Tooltip metrik menjelaskan cara hitung + keterbatasan (F-63)
- Commit belum terhubung tampil dengan link ke mapping
- Mahasiswa bisa tambah kontribusi non-kode
- Dosen dan mahasiswa lihat data yang sama

---

## TASK-08: Milestone & Submission

**Prioritas:** P0
**Estimasi:** 1.5 hari
**Depends on:** TASK-02
**PRD refs:** F-70, F-71, F-72, F-73

### Deliverables

- [x] `src/app/(dashboard)/courses/[courseId]/milestones/page.tsx`:
  - Dosen: daftar milestone + status per kelompok (submitted/pending/late) — F-72
  - Mahasiswa: daftar milestone + status kelompoknya — F-66
  - Klik milestone → expand detail: daftar kelompok + status + links + note
- [x] `src/app/(dashboard)/courses/[courseId]/milestones/new/page.tsx`:
  - Form: judul, deskripsi (opsional), tenggat (date picker)
  - Submit → createMilestone
- [x] `src/actions/milestone.ts`:
  - `createMilestone(courseId, { title, description, dueAt })`:
    - `requireLecturer(courseId)`
    - Buat Milestone
    - Auto-create Submission (status=PENDING) untuk setiap Group di course
  - `submitMilestone(submissionId, { links })`:
    - `requireMember` (anggota kelompok submission)
    - Update Submission: status=SUBMITTED (atau LATE jika `now() > dueAt`), links, submittedAt
  - `addLecturerNote(submissionId, note)`:
    - `requireLecturer` (owner course)
    - Update Submission.lecturerNote
- [x] `src/components/forms/milestone-form.tsx`
- [x] `src/components/dashboard/milestone-tracker.tsx`:
  - Progress bar: X of Y kelompok sudah submit
  - Status badges: PENDING (abu), SUBMITTED (hijau), LATE (merah)
- [x] `src/lib/jobs/check-late.ts`:
  - Cron tiap jam: `SELECT * FROM submissions WHERE status = 'PENDING' AND milestone.dueAt < now()`
  - Update status → LATE
  - Idempoten: skip yang sudah LATE
- [x] `src/lib/queries/milestone.ts`:
  - `getMilestones(courseId)` — with submission counts per status
  - `getMilestoneDetail(milestoneId)` — with all submissions + group info

### Acceptance criteria

- Dosen buat milestone → Submission auto-created per kelompok
- Mahasiswa submit → status SUBMITTED (atau LATE jika lewat tenggat)
- Dosen lihat status per kelompok per milestone
- Dosen tambah catatan di submission
- Job check-late mengubah PENDING → LATE setelah tenggat

---

## TASK-09: Notifikasi & Email

**Prioritas:** P0
**Estimasi:** 2 hari
**Depends on:** TASK-08
**PRD refs:** F-50, F-51, F-53, F-80, F-81, F-82

### Deliverables

- [ ] `src/lib/jobs/compute-status.ts`:
  - Cron tiap jam
  - Per Group (course not archived): hitung `daysSinceLastActivity`
  - Bandingkan dengan `Course.slowThreshold` dan `Course.inactiveThreshold`
  - Update `Group.status` jika berubah
  - Jika status baru = INACTIVE → enqueue `send-notification` (type: GROUP_INACTIVE, userId: course.lecturerId)
- [ ] `src/lib/jobs/send-notification.ts`:
  - Generic email sender
  - Input: `{ type, userId, metadata }`
  - Cek `NotificationPreference` → skip jika user matikan jenis ini
  - Buat Notification row (status=PENDING)
  - Kirim via Resend
  - Update Notification: SENT + sentAt, atau FAILED
  - Idempoten: cek Notification row sudah ada untuk type+userId+metadata key yang sama dalam 24 jam
- [ ] `src/lib/jobs/milestone-reminder.ts`:
  - Cron harian 08:00 WIB (01:00 UTC)
  - Query milestones dengan `dueAt` dalam 3 hari atau 1 hari
  - Per milestone: query semua Submission yang masih PENDING
  - Per submission: enqueue `send-notification` ke semua anggota kelompok (type: MILESTONE_REMINDER_3D atau MILESTONE_REMINDER_1D)
- [ ] `src/lib/jobs/weekly-summary.ts`:
  - Cron Senin 08:00 WIB
  - Per LECTURER yang `emailWeeklySummary = true`:
    - Query courses → groups → status summary
    - Query milestones terlambat
    - Enqueue `send-notification` (type: WEEKLY_SUMMARY)
- [ ] `src/emails/group-inactive.tsx`:
  - Template React Email: "Kelompok {nama} di {course} tidak aktif sejak {tanggal}"
  - Link ke dashboard kelompok
- [ ] `src/emails/milestone-reminder.tsx`:
  - Template: "Tenggat {milestone} dalam {3/1} hari"
  - Link ke halaman milestone
- [ ] `src/emails/weekly-summary.tsx`:
  - Template: ringkasan per course — kelompok aktif/melambat/tidak aktif, milestone terlambat
  - Link ke dashboard
- [ ] `src/actions/notification.ts`:
  - `updatePreferences({ emailGroupInactive, emailMilestoneReminder, emailWeeklySummary })` — `requireAuth()`, upsert NotificationPreference
- [ ] `src/app/(dashboard)/settings/page.tsx`:
  - Toggle per jenis notifikasi email
  - Default: semua aktif
- [ ] `src/lib/queries/notification.ts`:
  - `getPreferences(userId)` — return preferences dengan defaults

### Acceptance criteria

- Kelompok tidak aktif > threshold hari → dosen dapat email (F-81)
- H-3 dan H-1 sebelum tenggat → mahasiswa dapat email (F-80)
- Senin pagi → dosen dapat ringkasan mingguan
- User bisa matikan notifikasi per jenis (F-82)
- Email tidak duplikat dalam 24 jam (idempoten)
- Status kelompok terupdate tiap jam

---

## TASK-10: Landing Page & Polish

**Prioritas:** P1
**Estimasi:** 1 hari
**Depends on:** TASK-01 (bisa paralel dengan task lain)
**PRD refs:** —

### Deliverables

- [ ] `src/app/page.tsx` — landing page:
  - Hero: tagline, value proposition, tombol "Masuk dengan GitHub"
  - Section: cara kerja (3 langkah), fitur utama (3–4 item), FAQ singkat
  - Footer: link GitHub repo, kontak tim
  - Bahasa Indonesia
- [ ] `src/components/layout/consent-banner.tsx`:
  - Banner di halaman connect repo
  - Teks: data apa yang dikumpulkan, siapa yang bisa lihat, hak penghapusan
- [ ] `src/app/_components/` — komponen landing page (hero, features, faq)
- [ ] `public/` assets:
  - Logo (SVG)
  - Favicon
  - OG image (1200x630)
- [ ] Responsive polish:
  - Cek semua halaman di viewport 375px (mobile) dan 1280px (desktop)
  - Fix spacing, overflow, font size yang bermasalah
  - **Hanya CSS/className changes**, tidak ada logic changes

### Acceptance criteria

- Landing page tampil dengan baik di mobile dan desktop
- Tombol login mengarah ke flow auth
- Consent banner informatif dan jelas
- Semua teks dalam Bahasa Indonesia

---

## Dependency Graph

```
TASK-01 ──┬── TASK-02 ──┬── TASK-03 ──── TASK-06
          │             │
          │             └── TASK-08 ──── TASK-09
          │
          ├── TASK-04 ──┬── TASK-05
          │             │
          │             └── TASK-07
          │
          └── TASK-10 (paralel, kapan saja)
```

### Urutan eksekusi yang disarankan

```
Minggu 1:  TASK-01 → TASK-02 (sequential, hari 1–2)
Minggu 1:  TASK-10 (paralel, bisa mulai hari 1)
Minggu 2:  TASK-03 + TASK-04 (paralel, 2 orang berbeda)
Minggu 3:  TASK-06 + TASK-05 + TASK-08 (paralel, 3 orang)
Minggu 4:  TASK-07 + TASK-09 (paralel, 2 orang)
```

### Total estimasi: ~16.5 hari kerja (4 orang paralel ≈ 4–5 minggu)

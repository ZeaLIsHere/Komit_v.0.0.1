# Dokumen Arsitektur Teknis: Komit Platform

**Versi:** 0.1 — **Tanggal:** 4 November 2026 — **Status:** Draft teknis hasil planning

Dokumen ini adalah pelengkap teknis dari PRD. Semua keputusan di sini sudah mempertimbangkan kebutuhan fungsional (F-01 s.d. F-83) dan non-fungsional dari PRD.

---

## 1. Stack Teknologi

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 14+ (App Router, Server Components, Server Actions) | Fullstack monolith, satu codebase |
| Runtime | Node.js 20 LTS | Long-term support, native fetch |
| Database | PostgreSQL 16 (Railway managed) | Relasional, mature, `jsonb` untuk metadata |
| ORM | Prisma 5 | Type-safe, migrasi terkelola, cocok dengan Next.js |
| Job Queue | pg-boss 9 | Queue di PostgreSQL, zero infra tambahan |
| Auth | NextAuth.js v5 (Auth.js) | GitHub OAuth provider built-in |
| Email | Resend | API simpel, free tier 100 email/hari cukup untuk pilot |
| Styling | Tailwind CSS 3 + shadcn/ui | Utility-first, komponen siap pakai, responsif |
| Hosting | Railway | PostgreSQL + app satu platform, persistent server untuk worker |
| Monitoring | Sentry (error) + Railway metrics | Observabilitas minimum viable |

---

## 2. Auth Flow

### 2.1 Login

```
User klik "Masuk dengan GitHub"
  → NextAuth redirect ke GitHub OAuth
  → GitHub callback dengan code
  → NextAuth exchange code → access token + profile
  → Cek tabel AllowedLecturer (githubUsername ATAU email)
    → Cocok: set role = LECTURER
    → Tidak cocok: set role = STUDENT
  → Upsert ke tabel User (githubId sebagai key)
  → Buat session (JWT strategy, disimpan di cookie)
  → Redirect ke halaman sesuai role
```

### 2.2 Onboarding mahasiswa (F-04)

Setelah login pertama, mahasiswa yang belum punya `name` dan `nim` diarahkan ke halaman onboarding:

```
GET /onboarding → form nama lengkap + NIM
POST /api/user/complete-profile → validasi NIM unik, update User
  → Redirect ke /dashboard
```

Middleware Next.js cek `user.name === null` → redirect ke `/onboarding`. Semua route selain `/onboarding` dan `/api/auth` diblokir sampai profil lengkap.

### 2.3 Session strategy

- **JWT** (bukan database session) — mengurangi query per request.
- Token berisi: `userId`, `role`, `githubId`, `name`.
- Expiry: 7 hari, refresh otomatis.

### 2.4 Otorisasi

Middleware layer di server actions dan route handlers:

```typescript
// Pattern otorisasi — dipakai di semua server actions
async function requireLecturer(courseId: string) {
  const session = await auth();
  if (!session) throw new AuthError("Unauthorized");
  if (session.user.role !== "LECTURER") throw new AuthError("Forbidden");
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (course?.lecturerId !== session.user.id) throw new AuthError("Forbidden");
  return { session, course };
}

async function requireMember(groupId: string) {
  const session = await auth();
  if (!session) throw new AuthError("Unauthorized");
  const membership = await db.membership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } }
  });
  if (!membership) throw new AuthError("Forbidden");
  return { session, membership };
}
```

---

## 3. GitHub App & Webhook

### 3.1 GitHub App setup

Registrasi di github.com/settings/apps:

| Setting | Nilai |
|---|---|
| App name | Komit Platform |
| Webhook URL | `https://<domain>/api/github/webhook` |
| Webhook secret | Random 40-char hex, simpan di env |
| Permissions (repository) | Contents: read, Pull requests: read, Issues: read, Metadata: read |
| Events subscribed | `push`, `pull_request`, `pull_request_review`, `issues`, `issue_comment` |
| Request user auth | Tidak (app-level, bukan user-level) |

### 3.2 Flow instalasi (F-20)

```
Mahasiswa klik "Hubungkan Repo" di halaman kelompok
  → Redirect ke https://github.com/apps/komit-platform/installations/new
  → Mahasiswa pilih repo, install GitHub App
  → GitHub redirect ke callback URL dengan installation_id + setup_action
  → GET /api/github/callback?installation_id=X&setup_action=install
  → Server:
    1. Fetch repo list dari GitHub API (GET /installation/repositories)
    2. Tampilkan layar consent: "Data yang akan dikumpulkan: ..."
    3. User konfirmasi
    4. Simpan Repository row (installationId, githubRepoId, fullName)
    5. Enqueue job "backfill" ke pg-boss
```

### 3.3 Webhook handler (F-22)

Route: `POST /api/github/webhook`

```
Request masuk
  → Baca raw body (perlu config Next.js: bodyParser = false di route)
  → Verifikasi HMAC-SHA256 signature (header x-hub-signature-256)
    → Gagal: return 401
  → Parse JSON body
  → Lookup Repository by installationId
    → Tidak ditemukan: return 200 (ignore, repo belum dihubungkan)
  → Enqueue job "process-webhook-event" ke pg-boss
    → Payload: { event type, body, repoId }
  → Return 200 OK (cepat, processing di background)
```

**Prinsip:** webhook handler hanya validasi + enqueue. Semua logic di job worker. Ini memastikan:
- Response cepat (GitHub timeout 10 detik)
- Idempoten (job bisa retry)
- Event tidak hilang saat server restart

### 3.4 Backfill (F-21)

Job `backfill` di pg-boss:

```
Input: { repoId, installationId }

1. Generate installation access token (POST /app/installations/{id}/access_tokens)
2. Fetch commits: GET /repos/{owner}/{repo}/commits?per_page=100
   → Paginate sampai habis atau 1000 commit
   → Per commit: buat ActivityEvent (type=COMMIT)
3. Fetch PRs: GET /repos/{owner}/{repo}/pulls?state=all&per_page=100
   → Per PR: buat event PR_OPENED, PR_MERGED (jika merged)
   → Fetch reviews: GET /repos/{owner}/{repo}/pulls/{number}/reviews
   → Per review: buat event PR_REVIEW
4. Fetch issues: GET /repos/{owner}/{repo}/issues?state=all&per_page=100
   → Filter out PRs (GitHub API campur issues dan PRs)
   → Per issue: buat event ISSUE_OPENED, ISSUE_CLOSED
5. Jalankan noise filter pada semua event baru
6. Jalankan auto identity mapping
7. Update Repository.backfillDoneAt
8. Update Group.lastActivityAt dari event terbaru
```

**Rate limit handling (F-25):**
- Cek header `X-RateLimit-Remaining` setiap response
- Jika < 10: pause job, reschedule ke waktu `X-RateLimit-Reset`
- pg-boss mendukung `startAfter` untuk delayed retry
- Secondary rate limit (abuse): exponential backoff, max 3 retry

### 3.5 Webhook event processing

Job `process-webhook-event`:

```
Input: { eventType, body, repoId }

Switch eventType:
  "push":
    → body.commits[] → untuk setiap commit:
      - Skip jika SHA sudah ada (idempoten via @@unique)
      - Buat ActivityEvent(type=COMMIT, sha, author, timestamp)
      - Jalankan noise filter
      - Coba auto identity mapping

  "pull_request":
    → action "opened": buat PR_OPENED event
    → action "closed" + merged=true: buat PR_MERGED event
      - Jika squash merge: atribusikan ke PR author (F-34)
    → Cek co-authored-by di body (F-33, P1)

  "pull_request_review":
    → Buat PR_REVIEW event

  "issues":
    → action "opened": buat ISSUE_OPENED event
    → action "closed": buat ISSUE_CLOSED event

  "issue_comment":
    → Buat PR_COMMENT atau ISSUE_COMMENT berdasarkan issue.pull_request

Setelah semua event diproses:
  → Update Group.lastActivityAt
  → ActivityEvent.week diisi: truncate occurredAt ke Senin 00:00 UTC
```

---

## 4. Noise Filter (F-42)

### 4.1 Filter bawaan

Setiap ActivityEvent commit diperiksa terhadap aturan berikut. Jika terkena, `isFiltered = true`:

```typescript
const NOISE_PATTERNS = {
  // File path patterns — commit yang HANYA mengubah file ini dianggap noise
  files: [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'composer.lock',
    'Gemfile.lock',
    'Cargo.lock',
    'go.sum',
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/vendor/**',
    '**/*.min.js',
    '**/*.min.css',
    '**/*.map',
    '**/*.generated.*',
  ],

  // Commit message patterns — merge commit, bot commit
  messages: [
    /^Merge (branch|pull request|remote)/i,
    /^Initial commit$/i,
    /^\[bot\]/i,
    /^Auto-generated/i,
  ],
};
```

### 4.2 Cara kerja filter

```
Untuk setiap commit event:
  1. Cek commit message terhadap NOISE_PATTERNS.messages
     → Cocok: isFiltered = true, selesai
  2. Fetch file list commit (dari metadata atau API)
     → SEMUA file cocok NOISE_PATTERNS.files + course.excludePatterns?
     → Ya: isFiltered = true
     → Sebagian: isFiltered = false (ada file bermakna)
  3. Cek whitespace-only changes (jika metadata tersedia)
     → Semua diff hanya whitespace: isFiltered = true
```

**Catatan:** event yang `isFiltered = true` tetap disimpan di database, hanya tidak dihitung di metrik. Dosen tetap bisa melihat jika mau.

### 4.3 Custom patterns (F-43, P2)

Dosen bisa menambah pola di `Course.excludePatterns`:

```
Contoh: ["**/*.sql", "database/seeds/**"]
```

Diproses bersamaan dengan noise filter bawaan.

---

## 5. Identity Mapping (F-30–F-34)

### 5.1 Auto-mapping

Saat event masuk, sistem coba auto-match `githubAuthor` ke User:

```
1. Exact match: githubAuthor === User.username → set userId
2. Email match: commit author email === User.email → set userId
3. Existing mapping: cek IdentityMapping(repoId, rawAuthor) → set userId
4. Tidak cocok: userId = null, event masuk daftar "belum terhubung"
```

### 5.2 Manual mapping (F-32)

Halaman kelompok menampilkan daftar commit yang `userId = null`:

```
Anggota pilih rawAuthor → pilih User dari dropdown anggota kelompok → Simpan
  → Buat/update IdentityMapping
  → Batch update semua ActivityEvent dengan rawAuthor yang sama di repo itu
  → Log: createdById = siapa yang memetakan
```

### 5.3 Squash merge attribution (F-34)

Saat `pull_request` event dengan `action=closed` dan `merged=true`:
- `merge_commit_sha` ada di payload
- Jika commit message mengandung `(#123)` pattern (squash merge default)
- Atribusikan ke PR author (`pull_request.user.login`), bukan merger
- Event yang sudah dibuat dari push webhook untuk merge commit: update `userId` ke PR author

### 5.4 Co-authored-by (F-33, P1)

Parse commit message body:

```
Co-authored-by: Name <email@example.com>
```

Buat ActivityEvent tambahan untuk setiap co-author yang bisa dimapping ke User.

---

## 6. Metrik Aktivitas & Agregasi (F-40–F-45)

### 6.1 Metrik per anggota per minggu (F-40)

Query aggregation dari ActivityEvent:

```sql
SELECT
  user_id,
  week,
  COUNT(*) FILTER (WHERE type = 'COMMIT' AND NOT is_filtered) AS commits,
  COUNT(*) FILTER (WHERE type = 'PR_OPENED') AS prs_opened,
  COUNT(*) FILTER (WHERE type = 'PR_MERGED') AS prs_merged,
  COUNT(*) FILTER (WHERE type IN ('PR_REVIEW', 'PR_COMMENT')) AS reviews,
  COUNT(*) FILTER (WHERE type IN ('ISSUE_OPENED', 'ISSUE_CLOSED')) AS issues,
  COUNT(DISTINCT DATE(occurred_at)) FILTER (WHERE NOT is_filtered) AS active_days
FROM activity_events
WHERE repo_id IN (SELECT id FROM repositories WHERE group_id = $groupId)
  AND user_id IS NOT NULL
  AND is_filtered = false
GROUP BY user_id, week
ORDER BY week DESC;
```

### 6.2 Metrik per kelompok per minggu (F-41)

```sql
SELECT
  week,
  COUNT(*) FILTER (WHERE NOT is_filtered) AS total_events,
  COUNT(DISTINCT user_id) FILTER (WHERE NOT is_filtered) AS active_members
FROM activity_events
WHERE repo_id IN (SELECT id FROM repositories WHERE group_id = $groupId)
  AND is_filtered = false
GROUP BY week
ORDER BY week DESC;
```

### 6.3 Dedup commit (F-42)

- SHA-based: `@@unique([repoId, type, sha])` mencegah duplikat dari multi-branch
- Merge commit: difilter via noise filter

### 6.4 Baris kode (F-44)

`linesAdded` dan `linesRemoved` disimpan di ActivityEvent tapi:
- Tidak ditampilkan di ringkasan utama
- Tersedia di halaman detail sebagai info sekunder
- Tidak dipakai dalam perhitungan status atau peringatan

### 6.5 Dashboard performance (F-63 acceptance criteria)

Target: 40 kelompok tampil dalam < 3 detik.

Strategi:
- Query pakai `week` index, bukan compute on-the-fly
- `Group.status` dan `Group.lastActivityAt` sudah pre-computed
- Milestone status: JOIN ke Submission, sudah indexed
- Tidak perlu materialized view untuk scale MVP

---

## 7. Status Kelompok & Peringatan (F-50–F-54)

### 7.1 Status computation job

pg-boss cron job: `compute-group-status`, jalan **setiap jam**.

```
Untuk setiap Group yang course-nya tidak archived:
  1. Hitung daysSinceLastActivity = now() - Group.lastActivityAt
     (null lastActivityAt = INACTIVE)
  2. Lookup Course.slowThreshold dan Course.inactiveThreshold
  3. Tentukan status baru:
     - daysSince <= slowThreshold → ACTIVE
     - daysSince <= inactiveThreshold → SLOWING
     - daysSince > inactiveThreshold → INACTIVE
  4. Jika status berubah:
     - Update Group.status
     - Jika status baru = INACTIVE:
       → Enqueue job "send-notification" (type: GROUP_INACTIVE, ke dosen)
```

### 7.2 Penanda per anggota (F-52, P1)

Computed at query time (tidak di-cache, karena hanya dilihat di halaman detail):

```typescript
type MemberFlag =
  | { type: 'NO_ACTIVITY'; weeks: number }      // "tidak ada aktivitas X minggu"
  | { type: 'LAST_MINUTE'; daysBeforeDeadline: number } // "aktivitas hanya 3 hari sebelum tenggat"
  | null;

function computeMemberFlags(events: ActivityEvent[], milestones: Milestone[]): MemberFlag {
  // Cek minggu terakhir tanpa event
  // Cek cluster aktivitas dekat tenggat
}
```

### 7.3 Periode libur (F-54, P2)

Field tambahan di Course (belum di schema, tambah saat implementasi P2):
```
holidayPeriods: { start: DateTime, end: DateTime }[]
```

Status computation job skip kalau hari ini masuk periode libur.

---

## 8. CSV Import (F-11)

### 8.1 Format CSV

```csv
nama_kelompok,nim_1,nim_2,nim_3,nim_4,nim_5
Kelompok Alpha,211401001,211401002,211401003,,
Kelompok Beta,211401004,211401005,211401006,211401007,
```

Kolom NIM variabel (3–5 anggota). Kolom kosong diabaikan.

### 8.2 Processing

```
Upload CSV → parse di server action
  → Validasi:
    - Header harus ada "nama_kelompok" dan minimal 1 kolom NIM
    - Nama kelompok tidak boleh kosong
    - NIM format: angka, panjang sesuai aturan kampus
    - NIM tidak boleh duplikat lintas kelompok dalam 1 course
  → Per baris:
    - Buat Group (nama, inviteCode auto-generate)
    - Per NIM: cek User dengan NIM itu
      → Ada: buat Membership langsung
      → Tidak ada: simpan NIM di pending list (mahasiswa join manual nanti)
  → Return hasil:
    - Kelompok berhasil: X
    - Baris gagal: [{baris, alasan}]
    - NIM belum terdaftar: [NIM list] (mahasiswa perlu login dulu)
```

### 8.3 Alternative: manual create

Dosen buat kelompok satu per satu via form. Bagikan `inviteCode` ke mahasiswa.

---

## 9. Milestone & Submission (F-70–F-74)

### 9.1 Milestone lifecycle

```
Dosen buat Milestone (title, description, dueAt) → berlaku untuk SEMUA kelompok di course
  → Sistem auto-create Submission (status=PENDING) per kelompok
  → H-3 sebelum dueAt: job "milestone-reminder" enqueue email ke semua anggota (F-80)
  → H-1 sebelum dueAt: job "milestone-reminder" enqueue email lagi
```

### 9.2 Submission flow

```
Mahasiswa (anggota kelompok) buka halaman milestone
  → Klik "Tandai Selesai"
  → Isi links (1 atau lebih URL: repo, Google Docs, YouTube demo)
  → Submit
  → Update Submission: status=SUBMITTED, submittedAt=now()
  → Jika submittedAt > milestone.dueAt: status=LATE
```

### 9.3 Dosen review

Dashboard dosen menampilkan per milestone:
- Kelompok SUBMITTED: X
- Kelompok LATE: Y
- Kelompok PENDING: Z (belum submit)

Dosen bisa klik per kelompok → lihat links → tulis `lecturerNote`.

### 9.4 Status LATE otomatis

Job `check-late-submissions`, jalan **setiap jam**:

```
Cari Submission WHERE status = PENDING AND milestone.dueAt < now()
  → Update status = LATE
```

---

## 10. Notifikasi & Email (F-80–F-83)

### 10.1 Job schedule

| Job | Schedule | Target | Isi |
|---|---|---|---|
| `send-inactive-alert` | Triggered saat status berubah ke INACTIVE | Dosen (course lecturer) | "Kelompok {X} tidak aktif sejak {tanggal}" |
| `send-milestone-reminder` | Cron harian jam 08:00 WIB | Semua anggota kelompok yang PENDING | "Tenggat {milestone} dalam {3/1} hari" |
| `send-weekly-summary` | Cron Senin jam 08:00 WIB | Dosen yang opt-in | Ringkasan: kelompok aktif/melambat/tidak aktif, milestone terlambat |
| `check-late-submissions` | Cron tiap jam | Internal (update status) | — |
| `compute-group-status` | Cron tiap jam | Internal (update status) | — |

### 10.2 Resend integration

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({
    from: 'Komit <notifikasi@komit.app>',
    to,
    subject,
    html,
  });
  if (error) {
    // Update Notification.status = FAILED
    // Log error ke Sentry
  } else {
    // Update Notification.status = SENT, sentAt = now()
  }
}
```

### 10.3 Notification preference (F-82, P1)

Tabel `NotificationPreference` — user bisa matikan per jenis email.

Job cek preference sebelum kirim:

```
Sebelum kirim email:
  → Fetch NotificationPreference untuk userId
  → Jika emailGroupInactive = false, skip
  → Default: semua true (jika row belum ada)
```

### 10.4 Email templates

Pakai React Email (sudah cocok dengan Resend):
- `group-inactive.tsx` — peringatan kelompok tidak aktif
- `milestone-reminder.tsx` — pengingat tenggat
- `weekly-summary.tsx` — ringkasan mingguan dosen

Bahasa Indonesia. Simpel, informatif, ada link ke dashboard.

---

## 11. API Design — Server Actions vs Route Handlers

### 11.1 Prinsip

| Jenis | Pakai |
|---|---|
| **Server Actions** | Semua mutasi dari UI (form submission, button actions) |
| **Route Handlers** | Webhook GitHub, callback OAuth, endpoint yang dipanggil dari luar |

### 11.2 Server Actions (app layer)

```
src/app/actions/
  auth.ts          — completeProfile
  course.ts        — createCourse, archiveCourse, updateThresholds
  group.ts         — createGroup, importCSV, joinGroup, removeMember
  milestone.ts     — createMilestone, submitMilestone, addLecturerNote
  identity.ts      — mapIdentity
  contribution.ts  — addNonCodeContribution
  notification.ts  — updatePreferences
  repository.ts    — connectRepo, disconnectRepo
```

### 11.3 Route Handlers (external)

```
src/app/api/
  auth/[...nextauth]/route.ts     — NextAuth handler
  github/webhook/route.ts          — GitHub webhook receiver
  github/callback/route.ts         — GitHub App installation callback
```

### 11.4 Data fetching

Server Components langsung query Prisma. Tidak perlu API route untuk read.

```typescript
// src/app/(dashboard)/courses/[courseId]/page.tsx
export default async function CoursePage({ params }) {
  const { session } = await requireLecturer(params.courseId);
  const groups = await db.group.findMany({
    where: { courseId: params.courseId },
    include: { memberships: { include: { user: true } } },
    orderBy: { status: 'desc' }, // INACTIVE dulu
  });
  return <CourseGroups groups={groups} />;
}
```

---

## 12. pg-boss Worker Setup

### 12.1 Worker process

Next.js App Router tidak punya persistent background worker. Solusi: **custom server** atau **separate worker script**.

Pilihan: **instrumentation.ts** (Next.js instrumentation hook) — start pg-boss saat server boot.

```typescript
// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startWorker } = await import('./lib/worker');
    await startWorker();
  }
}
```

```typescript
// src/lib/worker.ts
import PgBoss from 'pg-boss';

const boss = new PgBoss(process.env.DATABASE_URL!);

export async function startWorker() {
  await boss.start();

  // Cron jobs
  await boss.schedule('compute-group-status', '0 * * * *');     // tiap jam
  await boss.schedule('check-late-submissions', '0 * * * *');   // tiap jam
  await boss.schedule('send-milestone-reminder', '0 1 * * *');  // 08:00 WIB = 01:00 UTC
  await boss.schedule('send-weekly-summary', '0 1 * * 1');      // Senin 08:00 WIB

  // Handlers
  await boss.work('process-webhook-event', processWebhookEvent);
  await boss.work('backfill', backfillRepo);
  await boss.work('compute-group-status', computeGroupStatus);
  await boss.work('check-late-submissions', checkLateSubmissions);
  await boss.work('send-milestone-reminder', sendMilestoneReminder);
  await boss.work('send-weekly-summary', sendWeeklySummary);
  await boss.work('send-notification', sendNotificationEmail);
}
```

### 12.2 Idempoten

Semua job handler harus idempoten:
- Webhook event: deduplicated via unique constraint pada SHA
- Status computation: selalu recompute, bukan increment
- Email: cek Notification.status sebelum kirim ulang

### 12.3 Retry

pg-boss default retry: 3x dengan exponential backoff. Cukup untuk MVP.

---

## 13. Folder Structure

```
komit/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── onboarding/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                    — sidebar, nav
│   │   │   ├── page.tsx                      — redirect ke courses
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx                  — daftar mata kuliah
│   │   │   │   ├── new/page.tsx              — buat mata kuliah
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx              — dashboard kelompok
│   │   │   │       ├── groups/
│   │   │   │       │   ├── import/page.tsx   — CSV import
│   │   │   │       │   └── [groupId]/
│   │   │   │       │       ├── page.tsx      — detail kelompok
│   │   │   │       │       └── mapping/page.tsx — identity mapping
│   │   │   │       ├── milestones/
│   │   │   │       │   ├── page.tsx          — daftar milestone
│   │   │   │       │   └── new/page.tsx      — buat milestone
│   │   │   │       └── settings/page.tsx     — threshold, exclude patterns
│   │   │   ├── groups/
│   │   │   │   └── join/page.tsx             — mahasiswa join via invite code
│   │   │   └── settings/page.tsx             — notification preferences
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── github/
│   │   │       ├── webhook/route.ts
│   │   │       └── callback/route.ts
│   │   ├── layout.tsx                        — root layout
│   │   └── page.tsx                          — landing page
│   ├── actions/                              — server actions
│   │   ├── auth.ts
│   │   ├── course.ts
│   │   ├── group.ts
│   │   ├── milestone.ts
│   │   ├── identity.ts
│   │   ├── contribution.ts
│   │   ├── notification.ts
│   │   └── repository.ts
│   ├── lib/
│   │   ├── db.ts                             — Prisma client singleton
│   │   ├── auth.ts                           — NextAuth config
│   │   ├── github.ts                         — GitHub API helpers
│   │   ├── worker.ts                         — pg-boss setup
│   │   ├── jobs/                             — job handlers
│   │   │   ├── backfill.ts
│   │   │   ├── process-webhook.ts
│   │   │   ├── compute-status.ts
│   │   │   ├── check-late.ts
│   │   │   ├── milestone-reminder.ts
│   │   │   ├── weekly-summary.ts
│   │   │   └── send-notification.ts
│   │   ├── noise-filter.ts                   — noise pattern matching
│   │   ├── identity.ts                       — auto-mapping logic
│   │   ├── metrics.ts                        — aggregation queries
│   │   └── week.ts                           — week truncation utility
│   ├── components/
│   │   ├── ui/                               — shadcn/ui components
│   │   ├── dashboard/
│   │   │   ├── group-card.tsx
│   │   │   ├── group-table.tsx
│   │   │   ├── activity-chart.tsx
│   │   │   ├── member-indicators.tsx
│   │   │   └── milestone-tracker.tsx
│   │   ├── forms/
│   │   │   ├── course-form.tsx
│   │   │   ├── milestone-form.tsx
│   │   │   └── csv-upload.tsx
│   │   └── layout/
│   │       ├── sidebar.tsx
│   │       ├── nav.tsx
│   │       └── consent-banner.tsx
│   ├── emails/                               — React Email templates
│   │   ├── group-inactive.tsx
│   │   ├── milestone-reminder.tsx
│   │   └── weekly-summary.tsx
│   └── instrumentation.ts                    — pg-boss bootstrap
├── public/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 14. Routing & Page Map

| Route | Akses | Fungsi |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Login dengan GitHub |
| `/onboarding` | Authenticated, profil belum lengkap | Isi nama + NIM |
| `/courses` | LECTURER | Daftar mata kuliah dosen |
| `/courses/new` | LECTURER | Buat mata kuliah |
| `/courses/[id]` | LECTURER (owner) | Dashboard kelompok |
| `/courses/[id]/groups/import` | LECTURER | Import CSV |
| `/courses/[id]/groups/[gid]` | LECTURER atau MEMBER | Detail kelompok |
| `/courses/[id]/groups/[gid]/mapping` | MEMBER | Identity mapping |
| `/courses/[id]/milestones` | LECTURER atau STUDENT (course) | Daftar milestone |
| `/courses/[id]/milestones/new` | LECTURER | Buat milestone |
| `/courses/[id]/settings` | LECTURER | Threshold, patterns |
| `/groups/join` | STUDENT | Join kelompok via invite code |
| `/settings` | Authenticated | Notification preferences |

---

## 15. Keamanan

| Concern | Implementasi |
|---|---|
| Webhook signature | HMAC-SHA256, verifikasi setiap request |
| GitHub token | Encrypted at rest (Railway env vars), short-lived installation tokens |
| CSRF | Server Actions otomatis dilindungi Next.js |
| SQL injection | Prisma parameterized queries |
| XSS | React auto-escape, no `dangerouslySetInnerHTML` |
| Isolasi data | Semua query filter by courseId/groupId, otorisasi di server action |
| Rate limiting | Bisa tambah `next-rate-limit` di API routes jika perlu |
| HTTPS | Railway default HTTPS |

---

## 16. Deployment (Railway)

```
Railway Project
├── Service: komit-web (Next.js)
│   ├── Build: npm run build
│   ├── Start: npm start
│   ├── Env: DATABASE_URL, GITHUB_APP_ID, GITHUB_PRIVATE_KEY,
│   │        GITHUB_WEBHOOK_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
│   │        NEXTAUTH_SECRET, NEXTAUTH_URL, RESEND_API_KEY
│   └── Auto-deploy: push ke main branch
├── Database: PostgreSQL 16
│   ├── Daily backup (Railway built-in)
│   └── Connection pool via DATABASE_URL
└── (Opsional) Redis — tidak dipakai di MVP
```

---

## 17. Alur Data End-to-End

```
GitHub repo
  ↓ (webhook event / backfill API call)
POST /api/github/webhook
  ↓ (verify signature, enqueue)
pg-boss queue
  ↓ (job worker picks up)
process-webhook-event job
  ↓ (parse, create ActivityEvent, noise filter, identity mapping)
PostgreSQL (activity_events table)
  ↓ (query by week, group, user)
Server Component (dashboard page)
  ↓ (render with data)
Browser (dosen/mahasiswa sees dashboard)

Parallel:
  pg-boss cron → compute-group-status → update groups.status
                                       → trigger send-notification → Resend email
  pg-boss cron → check-late-submissions → update submissions.status
  pg-boss cron → send-milestone-reminder → Resend email
  pg-boss cron → send-weekly-summary → Resend email
```

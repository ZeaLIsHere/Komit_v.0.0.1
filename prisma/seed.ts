import { PrismaClient, GroupStatus, EventType, SubmissionStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function truncateToWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ---------------------------------------------------------------------------
// Main Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱  Memulai seed data demo...");

  // -------------------------------------------------------------------------
  // 1. AllowedLecturer whitelist
  // -------------------------------------------------------------------------
  const allowedLecturer = await prisma.allowedLecturer.upsert({
    where: { email: "dosen@usu.ac.id" },
    update: {},
    create: {
      githubUsername: "dosen-pilot",
      email: "dosen@usu.ac.id",
    },
  });
  console.log("✅  AllowedLecturer:", allowedLecturer.email);

  // -------------------------------------------------------------------------
  // 2. User: Dosen
  // -------------------------------------------------------------------------
  const lecturer = await prisma.user.upsert({
    where: { githubId: "dosen-001" },
    update: {},
    create: {
      githubId: "dosen-001",
      username: "dosen-pilot",
      name: "Dr. Budi Santoso",
      email: "dosen@usu.ac.id",
      role: "LECTURER",
    },
  });
  console.log("✅  Dosen:", lecturer.name);

  // -------------------------------------------------------------------------
  // 3. Users: 15 Mahasiswa (3 per kelompok × 5 kelompok)
  // -------------------------------------------------------------------------
  const studentData = [
    // Kelompok 1 — Aktif
    { githubId: "mhs-101", username: "mhs-101", name: "Andi Pratama", nim: "211401001" },
    { githubId: "mhs-102", username: "mhs-102", name: "Budi Santoso", nim: "211401002" },
    { githubId: "mhs-103", username: "mhs-103", name: "Citra Dewi", nim: "211401003" },
    // Kelompok 2 — Aktif
    { githubId: "mhs-104", username: "mhs-104", name: "Dian Lestari", nim: "211401004" },
    { githubId: "mhs-105", username: "mhs-105", name: "Eko Firmansyah", nim: "211401005" },
    { githubId: "mhs-106", username: "mhs-106", name: "Fitri Handayani", nim: "211401006" },
    // Kelompok 3 — Melambat
    { githubId: "mhs-107", username: "mhs-107", name: "Galang Putra", nim: "211401007" },
    { githubId: "mhs-108", username: "mhs-108", name: "Hana Rahma", nim: "211401008" },
    { githubId: "mhs-109", username: "mhs-109", name: "Ivan Setiawan", nim: "211401009" },
    // Kelompok 4 — Melambat
    { githubId: "mhs-110", username: "mhs-110", name: "Julia Nanda", nim: "211401010" },
    { githubId: "mhs-111", username: "mhs-111", name: "Kevin Arianto", nim: "211401011" },
    { githubId: "mhs-112", username: "mhs-112", name: "Lisa Amalia", nim: "211401012" },
    // Kelompok 5 — Tidak Aktif
    { githubId: "mhs-113", username: "mhs-113", name: "Mario Putranto", nim: "211401013" },
    { githubId: "mhs-114", username: "mhs-114", name: "Nina Kartika", nim: "211401014" },
    { githubId: "mhs-115", username: "mhs-115", name: "Oscar Wijaya", nim: "211401015" },
  ];

  const students = await Promise.all(
    studentData.map((s) =>
      prisma.user.upsert({
        where: { githubId: s.githubId },
        update: {},
        create: { ...s, role: "STUDENT" },
      })
    )
  );
  console.log(`✅  ${students.length} mahasiswa dibuat`);

  // -------------------------------------------------------------------------
  // 4. Course
  // -------------------------------------------------------------------------
  const course = await prisma.course.upsert({
    where: { id: "seed-course-rpl-2026" },
    update: {},
    create: {
      id: "seed-course-rpl-2026",
      name: "Rekayasa Perangkat Lunak",
      code: "TIF2101",
      semester: "Ganjil 2026/2027",
      lecturerId: lecturer.id,
      slowThreshold: 7,
      inactiveThreshold: 14,
      excludePatterns: ["*.lock", "node_modules/**", "dist/**"],
    },
  });
  console.log("✅  Mata kuliah:", course.name);

  // -------------------------------------------------------------------------
  // 5. Groups
  // -------------------------------------------------------------------------
  type GroupSeed = {
    id: string;
    name: string;
    status: GroupStatus;
    inviteCode: string;
    lastActivityAt: Date | null;
    studentIndices: number[];
    activityDaysAgo: number; // days since last activity for event generation
  };

  const groupSeeds: GroupSeed[] = [
    {
      id: "seed-group-01",
      name: "Kelompok Alpha",
      status: "ACTIVE",
      inviteCode: "ALPHA001",
      lastActivityAt: daysAgo(1),
      studentIndices: [0, 1, 2],
      activityDaysAgo: 1,
    },
    {
      id: "seed-group-02",
      name: "Kelompok Beta",
      status: "ACTIVE",
      inviteCode: "BETA0002",
      lastActivityAt: daysAgo(2),
      studentIndices: [3, 4, 5],
      activityDaysAgo: 2,
    },
    {
      id: "seed-group-03",
      name: "Kelompok Gamma",
      status: "SLOWING",
      inviteCode: "GAMM0003",
      lastActivityAt: daysAgo(9),
      studentIndices: [6, 7, 8],
      activityDaysAgo: 9,
    },
    {
      id: "seed-group-04",
      name: "Kelompok Delta",
      status: "SLOWING",
      inviteCode: "DELT0004",
      lastActivityAt: daysAgo(11),
      studentIndices: [9, 10, 11],
      activityDaysAgo: 11,
    },
    {
      id: "seed-group-05",
      name: "Kelompok Epsilon",
      status: "INACTIVE",
      inviteCode: "EPSL0005",
      lastActivityAt: daysAgo(21),
      studentIndices: [12, 13, 14],
      activityDaysAgo: 21,
    },
  ];

  const groups = await Promise.all(
    groupSeeds.map((g) =>
      prisma.group.upsert({
        where: { id: g.id },
        update: { status: g.status, lastActivityAt: g.lastActivityAt },
        create: {
          id: g.id,
          courseId: course.id,
          name: g.name,
          inviteCode: g.inviteCode,
          status: g.status,
          lastActivityAt: g.lastActivityAt,
        },
      })
    )
  );
  console.log(`✅  ${groups.length} kelompok dibuat`);

  // -------------------------------------------------------------------------
  // 6. Memberships
  // -------------------------------------------------------------------------
  const membershipMap: Record<string, string[]> = {}; // groupId → membershipIds
  for (let gi = 0; gi < groupSeeds.length; gi++) {
    const group = groups[gi];
    const seed = groupSeeds[gi];
    membershipMap[group.id] = [];
    for (let si = 0; si < seed.studentIndices.length; si++) {
      const student = students[seed.studentIndices[si]];
      const isLeader = si === 0;
      const membership = await prisma.membership.upsert({
        where: { userId_groupId: { userId: student.id, groupId: group.id } },
        update: {},
        create: { userId: student.id, groupId: group.id, isLeader },
      });
      membershipMap[group.id].push(membership.id);
    }
  }
  console.log("✅  Membership dibuat");

  // -------------------------------------------------------------------------
  // 7. Repositories (1 per group, mocked)
  // -------------------------------------------------------------------------
  const repoMap: Record<string, string> = {}; // groupId → repoId
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    const repoId = `seed-repo-${gi + 1}`;
    const repo = await prisma.repository.upsert({
      where: { id: repoId },
      update: {},
      create: {
        id: repoId,
        groupId: group.id,
        githubRepoId: `mock-repo-${gi + 1}`,
        fullName: `usu-rpl-2026/${group.name.toLowerCase().replace(" ", "-")}`,
        installationId: `mock-install-${gi + 1}`,
        connectionStatus: "CONNECTED",
        backfillDoneAt: new Date(),
      },
    });
    repoMap[group.id] = repo.id;
  }
  console.log("✅  Repository dibuat");

  // -------------------------------------------------------------------------
  // 8. ActivityEvents
  // -------------------------------------------------------------------------
  type EventSeed = {
    type: EventType;
    daysAgo: number;
    sha: string;
    linesAdded?: number;
    linesRemoved?: number;
    title?: string;
  };

  for (let gi = 0; gi < groupSeeds.length; gi++) {
    const seed = groupSeeds[gi];
    const group = groups[gi];
    const repoId = repoMap[group.id];
    const memberStudents = seed.studentIndices.map((idx) => students[idx]);

    const eventTemplates: EventSeed[] = seed.status === "ACTIVE"
      ? [
          { type: "COMMIT", daysAgo: seed.activityDaysAgo, sha: `sha-${gi}-1`, linesAdded: 42, linesRemoved: 5, title: "feat: implementasi fitur login" },
          { type: "COMMIT", daysAgo: seed.activityDaysAgo, sha: `sha-${gi}-2`, linesAdded: 20, linesRemoved: 3, title: "fix: perbaiki validasi form" },
          { type: "PR_OPENED", daysAgo: seed.activityDaysAgo + 1, sha: `sha-${gi}-3`, title: "PR: fitur registrasi mahasiswa" },
          { type: "PR_MERGED", daysAgo: seed.activityDaysAgo, sha: `sha-${gi}-4`, title: "PR: merge fitur dashboard" },
          { type: "PR_REVIEW", daysAgo: seed.activityDaysAgo, sha: `sha-${gi}-5`, title: "Review: auth flow" },
        ]
      : seed.status === "SLOWING"
      ? [
          { type: "COMMIT", daysAgo: seed.activityDaysAgo, sha: `sha-${gi}-1`, linesAdded: 15, linesRemoved: 2, title: "refactor: cleanup kode lama" },
          { type: "PR_OPENED", daysAgo: seed.activityDaysAgo, sha: `sha-${gi}-2`, title: "PR: revisi laporan progress" },
        ]
      : [
          { type: "COMMIT", daysAgo: seed.activityDaysAgo, sha: `sha-${gi}-1`, linesAdded: 10, linesRemoved: 0, title: "init: initial commit" },
        ];

    for (let ei = 0; ei < eventTemplates.length; ei++) {
      const tmpl = eventTemplates[ei];
      const student = memberStudents[ei % memberStudents.length];
      const occurredAt = daysAgo(tmpl.daysAgo);

      await prisma.activityEvent.upsert({
        where: { repoId_type_sha: { repoId, type: tmpl.type, sha: tmpl.sha } },
        update: {},
        create: {
          repoId,
          type: tmpl.type,
          githubAuthor: student.username,
          userId: student.id,
          occurredAt,
          week: truncateToWeek(occurredAt),
          sha: tmpl.sha,
          isFiltered: false,
          linesAdded: tmpl.linesAdded ?? null,
          linesRemoved: tmpl.linesRemoved ?? null,
          title: tmpl.title ?? null,
        },
      });
    }
  }
  console.log("✅  ActivityEvent dibuat");

  // -------------------------------------------------------------------------
  // 9. Milestones
  // -------------------------------------------------------------------------
  const milestoneData = [
    {
      id: "seed-ms-1",
      title: "Laporan Analisis Kebutuhan",
      description: "Kumpulkan dokumen SRS dan diagram use case.",
      dueAt: daysAgo(14),
    },
    {
      id: "seed-ms-2",
      title: "Prototype UI",
      description: "Demo antarmuka aplikasi (Figma / running app).",
      dueAt: daysFromNow(3),
    },
    {
      id: "seed-ms-3",
      title: "Deliverable Akhir",
      description: "Kode final + dokumentasi + presentasi.",
      dueAt: daysFromNow(21),
    },
  ];

  const milestones = await Promise.all(
    milestoneData.map((m) =>
      prisma.milestone.upsert({
        where: { id: m.id },
        update: {},
        create: { ...m, courseId: course.id },
      })
    )
  );
  console.log(`✅  ${milestones.length} milestone dibuat`);

  // -------------------------------------------------------------------------
  // 10. Submissions (per group × milestone)
  // -------------------------------------------------------------------------
  const submissionMap: Record<string, Record<string, SubmissionStatus>> = {
    // milestone index → group index → status
    "seed-ms-1": {
      "seed-group-01": "SUBMITTED",
      "seed-group-02": "SUBMITTED",
      "seed-group-03": "LATE",
      "seed-group-04": "LATE",
      "seed-group-05": "PENDING",
    },
    "seed-ms-2": {
      "seed-group-01": "SUBMITTED",
      "seed-group-02": "PENDING",
      "seed-group-03": "PENDING",
      "seed-group-04": "PENDING",
      "seed-group-05": "PENDING",
    },
    "seed-ms-3": {
      "seed-group-01": "PENDING",
      "seed-group-02": "PENDING",
      "seed-group-03": "PENDING",
      "seed-group-04": "PENDING",
      "seed-group-05": "PENDING",
    },
  };

  for (const milestone of milestones) {
    for (const group of groups) {
      const status: SubmissionStatus =
        submissionMap[milestone.id]?.[group.id] ?? "PENDING";
      const submittedAt = status === "SUBMITTED" || status === "LATE" ? new Date() : null;
      await prisma.submission.upsert({
        where: { milestoneId_groupId: { milestoneId: milestone.id, groupId: group.id } },
        update: {},
        create: {
          milestoneId: milestone.id,
          groupId: group.id,
          status,
          links: status === "SUBMITTED" ? ["https://github.com/usu-rpl-2026/laporan"] : [],
          submittedAt,
        },
      });
    }
  }
  console.log("✅  Submission dibuat");

  // -------------------------------------------------------------------------
  // 11. NonCodeContributions (hanya untuk kelompok aktif)
  // -------------------------------------------------------------------------
  const activeGroupIndices = [0, 1]; // Alpha, Beta
  for (const gi of activeGroupIndices) {
    const group = groups[gi];
    const membershipIds = membershipMap[group.id];
    const contributions = [
      "Membuat wireframe tampilan halaman utama di Figma",
      "Menulis dokumentasi API endpoint autentikasi",
    ];
    for (let i = 0; i < Math.min(membershipIds.length, contributions.length); i++) {
      const week = truncateToWeek(daysAgo(3));
      await prisma.nonCodeContribution.create({
        data: {
          membershipId: membershipIds[i],
          description: contributions[i],
          week,
        },
      });
    }
  }
  console.log("✅  NonCodeContribution dibuat");

  console.log("\n🎉  Seed selesai! Data demo siap digunakan.");
  console.log(`\n📋  Ringkasan:`);
  console.log(`    • 1 dosen: ${lecturer.name} (github: ${lecturer.username})`);
  console.log(`    • ${students.length} mahasiswa`);
  console.log(`    • 1 mata kuliah: ${course.name} (${course.code})`);
  console.log(`    • ${groups.length} kelompok (2 Aktif, 2 Melambat, 1 Tidak Aktif)`);
  console.log(`    • ${milestones.length} milestone`);
}

main()
  .catch((e) => {
    console.error("❌  Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


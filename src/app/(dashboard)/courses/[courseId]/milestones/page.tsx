import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getMilestones,
  getStudentMilestones,
} from "@/lib/queries/milestone";
import {
  MilestoneTracker,
  type SubmissionGroupItem,
} from "@/components/dashboard/milestone-tracker";
import { Button } from "@/components/ui/button";
import { Flag, Plus, ChevronRight, Calendar } from "lucide-react";

export default async function MilestonesPage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await requireAuth();

  const course = await db.course.findUnique({
    where: { id: params.courseId },
    select: {
      id: true,
      name: true,
      code: true,
      semester: true,
      lecturerId: true,
    },
  });

  if (!course) {
    notFound();
  }

  const isLecturer = user.role === "LECTURER" && course.lecturerId === user.id;

  if (isLecturer) {
    const milestones = await getMilestones(params.courseId);

    // Fetch all submissions for each milestone for lecturer view
    const milestoneIds = milestones.map((m) => m.id);
    const allSubmissions = await db.submission.findMany({
      where: {
        milestoneId: { in: milestoneIds },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            memberships: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    nim: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        group: {
          name: "asc",
        },
      },
    });

    const submissionsByMilestone = new Map<string, SubmissionGroupItem[]>();
    for (const sub of allSubmissions) {
      const list = submissionsByMilestone.get(sub.milestoneId) ?? [];
      list.push(sub as unknown as SubmissionGroupItem);
      submissionsByMilestone.set(sub.milestoneId, list);
    }

    return (
      <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
          <Link
            href={`/courses/${course.id}`}
            className="hover:text-primary transition-colors truncate max-w-[200px]"
          >
            {course.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-outline shrink-0" />
          <span className="text-on-surface font-semibold font-mono">
            Manajemen Milestone
          </span>
        </nav>

        {/* Course & Context Sub-Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono mb-1">
              <span className="font-bold text-primary">FAKULTAS ILMU KOMPUTER & TEKNOLOGI INFORMASI</span>
              <span>•</span>
              <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface font-bold">
                KODE: {course.code}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              {course.code}: {course.name} ({course.semester})
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Kelola tenggat waktu sprint, verifikasi pengumpulan artefak dokumen/repositori, dan berikan catatan evaluasi.
            </p>
          </div>

          <Button
            asChild
            className="bg-primary-container hover:bg-primary text-white text-xs font-semibold h-9 gap-1.5 shadow-xs self-start lg:self-auto"
          >
            <Link href={`/courses/${params.courseId}/milestones/new`}>
              <Plus className="h-4 w-4" />
              <span>Buat Milestone Baru</span>
            </Link>
          </Button>
        </div>

        {milestones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
              <Flag className="h-6 w-6" />
            </div>
            <h3 className="font-display text-sm font-bold text-on-surface">
              Belum Ada Target Milestone
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Buat milestone pertama untuk menetapkan batas waktu pengumpulan tugas besar kelompok mahasiswa.
            </p>
            <Button asChild size="sm" className="bg-primary-container text-white text-xs">
              <Link href={`/courses/${params.courseId}/milestones/new`}>
                Buat Milestone Sekarang
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((m) => (
              <MilestoneTracker
                key={m.id}
                milestoneId={m.id}
                title={m.title}
                description={m.description}
                dueAt={m.dueAt}
                totalGroups={m.totalGroups}
                submittedCount={m.submittedCount}
                lateCount={m.lateCount}
                pendingCount={m.pendingCount}
                isLecturer={true}
                submissions={submissionsByMilestone.get(m.id) ?? []}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Student view
  const studentData = await getStudentMilestones(params.courseId, user.id);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
        <Link
          href={`/courses`}
          className="hover:text-primary transition-colors"
        >
          Mata Kuliah
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-outline shrink-0" />
        <span className="text-on-surface font-semibold font-mono">
          Milestone Tugas Besar
        </span>
      </nav>

      <div className="pb-4 border-b border-outline-variant">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Target Milestone & Pengumpulan
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
          {course.code} — {course.name} ({course.semester})
        </p>
      </div>

      {!studentData || studentData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center text-xs text-on-surface-variant">
          Belum ada milestone yang dijadwalkan untuk mata kuliah ini.
        </div>
      ) : (
        <div className="space-y-4">
          {studentData.map(({ milestone, submission }) => (
            <MilestoneTracker
              key={milestone.id}
              milestoneId={milestone.id}
              title={milestone.title}
              description={milestone.description}
              dueAt={milestone.dueAt}
              totalGroups={1}
              submittedCount={submission?.status === "SUBMITTED" ? 1 : 0}
              lateCount={submission?.status === "LATE" ? 1 : 0}
              pendingCount={submission?.status === "PENDING" ? 1 : 0}
              isLecturer={false}
              studentSubmission={
                submission
                  ? {
                      id: submission.id,
                      status: submission.status,
                      links: submission.links,
                      lecturerNote: submission.lecturerNote,
                      submittedAt: submission.submittedAt,
                      groupName: submission.groupName,
                    }
                  : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

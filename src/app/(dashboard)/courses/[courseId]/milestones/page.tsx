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
      list.push(sub as SubmissionGroupItem);
      submissionsByMilestone.set(sub.milestoneId, list);
    }

    return (
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Milestone Proyek</h1>
            <p className="text-sm text-muted-foreground">
              {course.code} — {course.name} ({course.semester})
            </p>
          </div>
          <Button asChild>
            <Link href={`/courses/${params.courseId}/milestones/new`}>
              + Buat Milestone Baru
            </Link>
          </Button>
        </div>

        {milestones.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Belum ada milestone yang dibuat untuk mata kuliah ini.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/courses/${params.courseId}/milestones/new`}>
                Buat Milestone Pertama
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
  const studentMilestones = await getStudentMilestones(
    params.courseId,
    user.id
  );

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Milestone & Tenggat</h1>
        <p className="text-sm text-muted-foreground">
          {course.code} — {course.name} ({course.semester})
        </p>
      </div>

      {studentMilestones.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada milestone yang ditentukan oleh dosen pengampu.
        </div>
      ) : (
        <div className="space-y-4">
          {studentMilestones.map(({ milestone, submission }) => (
            <MilestoneTracker
              key={milestone.id}
              milestoneId={milestone.id}
              title={milestone.title}
              description={milestone.description}
              dueAt={milestone.dueAt}
              totalGroups={1}
              submittedCount={submission?.status === "SUBMITTED" ? 1 : 0}
              lateCount={submission?.status === "LATE" ? 1 : 0}
              pendingCount={
                !submission || submission.status === "PENDING" ? 1 : 0
              }
              isLecturer={false}
              studentSubmission={submission}
            />
          ))}
        </div>
      )}
    </div>
  );
}

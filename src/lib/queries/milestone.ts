import { db } from "@/lib/db";
import { type Milestone, type Submission, type SubmissionStatus } from "@prisma/client";

export interface MilestoneWithStats extends Milestone {
  totalGroups: number;
  submittedCount: number;
  lateCount: number;
  pendingCount: number;
}

export interface StudentMilestoneItem {
  milestone: Milestone;
  submission: (Submission & { groupName: string }) | null;
}

export async function getMilestones(
  courseId: string
): Promise<MilestoneWithStats[]> {
  const [milestones, totalGroups] = await Promise.all([
    db.milestone.findMany({
      where: { courseId },
      include: {
        submissions: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { dueAt: "asc" },
    }),
    db.group.count({
      where: { courseId },
    }),
  ]);

  return milestones.map((m) => {
    let submittedCount = 0;
    let lateCount = 0;
    let pendingCount = 0;

    for (const sub of m.submissions) {
      if (sub.status === "SUBMITTED") submittedCount++;
      else if (sub.status === "LATE") lateCount++;
      else if (sub.status === "PENDING") pendingCount++;
    }

    const { submissions, ...rest } = m;
    return {
      ...rest,
      totalGroups,
      submittedCount,
      lateCount,
      pendingCount,
    };
  });
}

export async function getMilestoneDetail(milestoneId: string) {
  return db.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          lecturerId: true,
        },
      },
      submissions: {
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
      },
    },
  });
}

export async function getStudentMilestones(
  courseId: string,
  userId: string
): Promise<StudentMilestoneItem[]> {
  // Find group membership for this student in this course
  const membership = await db.membership.findFirst({
    where: {
      userId,
      group: {
        courseId,
      },
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const milestones = await db.milestone.findMany({
    where: { courseId },
    orderBy: { dueAt: "asc" },
  });

  if (!membership?.group) {
    return milestones.map((m) => ({
      milestone: m,
      submission: null,
    }));
  }

  const groupId = membership.group.id;
  const groupName = membership.group.name;

  const submissions = await db.submission.findMany({
    where: {
      groupId,
      milestone: {
        courseId,
      },
    },
  });

  const submissionMap = new Map<string, Submission>();
  for (const s of submissions) {
    submissionMap.set(s.milestoneId, s);
  }

  return milestones.map((m) => {
    const sub = submissionMap.get(m.id);
    return {
      milestone: m,
      submission: sub ? { ...sub, groupName } : null,
    };
  });
}

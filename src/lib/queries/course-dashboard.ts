import { db } from "@/lib/db";
import { type GroupStatus } from "@prisma/client";

export interface GroupDashboardItem {
  id: string;
  name: string;
  status: GroupStatus;
  lastActivityAt: Date | null;
  inviteCode: string;
  memberCount: number;
  activeMilestone: {
    id: string;
    title: string;
    dueAt: Date;
    status: "PENDING" | "SUBMITTED" | "LATE" | "NO_SUBMISSION";
  } | null;
}

export interface CourseDashboardData {
  course: {
    id: string;
    name: string;
    code: string;
    semester: string;
    archived: boolean;
    slowThreshold: number;
    inactiveThreshold: number;
  };
  groups: GroupDashboardItem[];
  stats: {
    totalGroups: number;
    activeCount: number;
    slowingCount: number;
    inactiveCount: number;
  };
}

/**
 * Fetches course dashboard data with all groups, statuses, member counts,
 * and current milestone progress in a single efficient query batch.
 */
export async function getCourseWithGroups(
  courseId: string
): Promise<CourseDashboardData | null> {
  const [course, nextUpcomingMilestone] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
      include: {
        groups: {
          include: {
            _count: {
              select: { memberships: true },
            },
            submissions: {
              include: {
                milestone: {
                  select: {
                    id: true,
                    title: true,
                    dueAt: true,
                  },
                },
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    }),
    // Find the current active/upcoming milestone for the course
    db.milestone.findFirst({
      where: {
        courseId,
        dueAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // active within 1 day past due or future
        },
      },
      orderBy: {
        dueAt: "asc",
      },
      select: {
        id: true,
        title: true,
        dueAt: true,
      },
    }),
  ]);

  if (!course) {
    return null;
  }

  let activeCount = 0;
  let slowingCount = 0;
  let inactiveCount = 0;

  const groups: GroupDashboardItem[] = course.groups.map((g) => {
    if (g.status === "ACTIVE") activeCount++;
    else if (g.status === "SLOWING") slowingCount++;
    else if (g.status === "INACTIVE") inactiveCount++;

    let activeMilestone: GroupDashboardItem["activeMilestone"] = null;

    if (nextUpcomingMilestone) {
      const sub = g.submissions.find(
        (s) => s.milestoneId === nextUpcomingMilestone.id
      );
      activeMilestone = {
        id: nextUpcomingMilestone.id,
        title: nextUpcomingMilestone.title,
        dueAt: nextUpcomingMilestone.dueAt,
        status: sub ? sub.status : "NO_SUBMISSION",
      };
    } else if (g.submissions.length > 0) {
      // Fallback: take latest submitted milestone
      const latestSub = g.submissions[g.submissions.length - 1];
      activeMilestone = {
        id: latestSub.milestone.id,
        title: latestSub.milestone.title,
        dueAt: latestSub.milestone.dueAt,
        status: latestSub.status,
      };
    }

    return {
      id: g.id,
      name: g.name,
      status: g.status,
      lastActivityAt: g.lastActivityAt,
      inviteCode: g.inviteCode,
      memberCount: g._count.memberships,
      activeMilestone,
    };
  });

  return {
    course: {
      id: course.id,
      name: course.name,
      code: course.code,
      semester: course.semester,
      archived: course.archived,
      slowThreshold: course.slowThreshold,
      inactiveThreshold: course.inactiveThreshold,
    },
    groups,
    stats: {
      totalGroups: groups.length,
      activeCount,
      slowingCount,
      inactiveCount,
    },
  };
}

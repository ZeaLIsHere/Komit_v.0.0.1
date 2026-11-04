import { db } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/jobs/send-notification";
import { type CourseSummaryItem } from "@/emails/weekly-summary";

export async function sendWeeklySummary(): Promise<{
  lecturersProcessed: number;
  summariesSent: number;
}> {
  const now = new Date();
  const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekRange = `${pastWeek.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  })} - ${now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  // Find all lecturers
  const lecturers = await db.user.findMany({
    where: {
      role: "LECTURER",
    },
    include: {
      notificationPrefs: true,
      courses: {
        where: { archived: false },
        include: {
          groups: {
            select: {
              status: true,
            },
          },
          milestones: {
            include: {
              submissions: {
                where: {
                  status: "LATE",
                },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  let lecturersProcessed = 0;
  let summariesSent = 0;

  for (const lecturer of lecturers) {
    lecturersProcessed++;

    if (lecturer.notificationPrefs?.emailWeeklySummary === false) {
      continue;
    }

    if (lecturer.courses.length === 0) {
      continue;
    }

    const courseSummaries: CourseSummaryItem[] = lecturer.courses.map((course) => {
      let activeCount = 0;
      let slowingCount = 0;
      let inactiveCount = 0;

      for (const g of course.groups) {
        if (g.status === "ACTIVE") activeCount++;
        else if (g.status === "SLOWING") slowingCount++;
        else if (g.status === "INACTIVE") inactiveCount++;
      }

      let lateSubmissionsCount = 0;
      for (const m of course.milestones) {
        lateSubmissionsCount += m.submissions.length;
      }

      return {
        code: course.code,
        name: course.name,
        activeCount,
        slowingCount,
        inactiveCount,
        lateSubmissionsCount,
      };
    });

    const res = await sendNotificationEmail({
      type: "WEEKLY_SUMMARY",
      userId: lecturer.id,
      metadata: {
        weekRange,
        courses: courseSummaries,
      },
    });

    if (res.success && !res.skipped) {
      summariesSent++;
    }
  }

  return { lecturersProcessed, summariesSent };
}

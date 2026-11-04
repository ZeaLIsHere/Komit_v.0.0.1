import { db } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/jobs/send-notification";

export async function sendMilestoneReminder(): Promise<{
  remindedMilestones: number;
  notificationsSent: number;
}> {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Query milestones that are upcoming within the next 4 days
  const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const upcomingMilestones = await db.milestone.findMany({
    where: {
      dueAt: {
        gt: now,
        lte: fourDaysFromNow,
      },
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
        },
      },
      submissions: {
        where: {
          status: "PENDING",
        },
        include: {
          group: {
            include: {
              memberships: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  let remindedMilestones = 0;
  let notificationsSent = 0;

  for (const milestone of upcomingMilestones) {
    const diffMs = milestone.dueAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let notifType: "MILESTONE_REMINDER_3D" | "MILESTONE_REMINDER_1D" | null = null;
    if (daysLeft === 3) {
      notifType = "MILESTONE_REMINDER_3D";
    } else if (daysLeft === 1) {
      notifType = "MILESTONE_REMINDER_1D";
    }

    if (!notifType) {
      continue;
    }

    remindedMilestones++;

    for (const sub of milestone.submissions) {
      const formattedDue = milestone.dueAt.toLocaleString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });

      for (const member of sub.group.memberships) {
        const res = await sendNotificationEmail({
          type: notifType,
          userId: member.userId,
          metadata: {
            refId: `reminder-${milestone.id}-${sub.groupId}-${notifType}-${todayStr}`,
            milestoneId: milestone.id,
            milestoneTitle: milestone.title,
            courseId: milestone.courseId,
            courseName: milestone.course.name,
            groupId: sub.groupId,
            groupName: sub.group.name,
            dueAt: formattedDue,
          },
        });

        if (res.success && !res.skipped) {
          notificationsSent++;
        }
      }
    }
  }

  return { remindedMilestones, notificationsSent };
}

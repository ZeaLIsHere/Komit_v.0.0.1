import { db } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/jobs/send-notification";
import { type GroupStatus } from "@prisma/client";

export async function computeGroupStatus(): Promise<{
  checkedGroups: number;
  updatedCount: number;
  inactivatedCount: number;
}> {
  const now = new Date();

  // Query all active courses and their groups
  const courses = await db.course.findMany({
    where: { archived: false },
    include: {
      groups: {
        select: {
          id: true,
          name: true,
          status: true,
          lastActivityAt: true,
          createdAt: true,
        },
      },
    },
  });

  let checkedGroups = 0;
  let updatedCount = 0;
  let inactivatedCount = 0;

  for (const course of courses) {
    for (const group of course.groups) {
      checkedGroups++;

      // If no activity recorded yet, measure from group creation
      const referenceDate = group.lastActivityAt ?? group.createdAt;
      const diffMs = now.getTime() - referenceDate.getTime();
      const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let newStatus: GroupStatus = "ACTIVE";
      if (daysSince > course.inactiveThreshold) {
        newStatus = "INACTIVE";
      } else if (daysSince > course.slowThreshold) {
        newStatus = "SLOWING";
      }

      if (newStatus !== group.status) {
        await db.group.update({
          where: { id: group.id },
          data: { status: newStatus },
        });
        updatedCount++;

        // Trigger alert to lecturer when status changes to INACTIVE
        if (newStatus === "INACTIVE") {
          inactivatedCount++;
          await sendNotificationEmail({
            type: "GROUP_INACTIVE",
            userId: course.lecturerId,
            metadata: {
              refId: `inactive-${group.id}-${now.toISOString().slice(0, 10)}`,
              courseId: course.id,
              courseName: course.name,
              groupId: group.id,
              groupName: group.name,
              daysInactive: daysSince,
              lastActivityDate: group.lastActivityAt
                ? group.lastActivityAt.toLocaleDateString("id-ID")
                : null,
            },
          });
        }
      }
    }
  }

  return { checkedGroups, updatedCount, inactivatedCount };
}

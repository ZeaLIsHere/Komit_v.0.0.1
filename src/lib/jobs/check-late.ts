import { db } from "@/lib/db";

/**
 * Cron job handler to mark overdue PENDING submissions as LATE.
 * Idempotent: only updates submissions that are currently PENDING with past due dates.
 */
export async function checkLateSubmissions(): Promise<{ updatedCount: number }> {
  const now = new Date();

  const overduePendingSubmissions = await db.submission.findMany({
    where: {
      status: "PENDING",
      milestone: {
        dueAt: {
          lt: now,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (overduePendingSubmissions.length === 0) {
    return { updatedCount: 0 };
  }

  const ids = overduePendingSubmissions.map((s) => s.id);

  const updateResult = await db.submission.updateMany({
    where: {
      id: { in: ids },
      status: "PENDING",
    },
    data: {
      status: "LATE",
    },
  });

  return { updatedCount: updateResult.count };
}

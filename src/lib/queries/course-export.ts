import { db } from "@/lib/db";
import { type Milestone } from "@prisma/client";

export type ExportRow = {
  nim: string;
  name: string;
  groupName: string;
  commitCount: number;
  prOpenedCount: number;
  prMergedCount: number;
  reviewCount: number;
  activeDays: number;
  nonCodeNotes: string;
  milestoneStatuses: Record<string, string>; // milestoneTitle → status
};

export type CourseExportData = {
  milestones: Milestone[];
  rows: ExportRow[];
};

/**
 * Fetches all data needed for the course CSV export.
 * Returns per-student rows with activity metrics and milestone statuses.
 */
export async function getCourseExportData(courseId: string): Promise<CourseExportData> {
  const [milestones, groups] = await Promise.all([
    db.milestone.findMany({
      where: { courseId },
      orderBy: { dueAt: "asc" },
    }),
    db.group.findMany({
      where: { courseId },
      include: {
        memberships: {
          include: {
            user: true,
            nonCodeContributions: true,
          },
        },
        repositories: {
          include: {
            events: {
              where: { isFiltered: false },
            },
          },
        },
        submissions: true,
      },
    }),
  ]);

  const rows: ExportRow[] = [];

  for (const group of groups) {
    // Build submission lookup: milestoneId → status
    const submissionByMilestone: Record<string, string> = {};
    for (const sub of group.submissions) {
      submissionByMilestone[sub.milestoneId] = sub.status;
    }

    // Collect all activity events for this group across all repos
    const allEvents = group.repositories.flatMap((r) => r.events);

    for (const membership of group.memberships) {
      const { user } = membership;

      // Filter events attributed to this user
      const userEvents = allEvents.filter((e) => e.userId === user.id);

      const commitCount = userEvents.filter((e) => e.type === "COMMIT").length;
      const prOpenedCount = userEvents.filter((e) => e.type === "PR_OPENED").length;
      const prMergedCount = userEvents.filter((e) => e.type === "PR_MERGED").length;
      const reviewCount = userEvents.filter((e) => e.type === "PR_REVIEW").length;

      // Active days = count of distinct calendar dates with any event
      const distinctDays = new Set(
        userEvents.map((e) => e.occurredAt.toISOString().slice(0, 10))
      );
      const activeDays = distinctDays.size;

      // Non-code contributions joined as semicolon-separated notes
      const nonCodeNotes = membership.nonCodeContributions
        .map((nc) => nc.description)
        .join("; ");

      // Milestone statuses
      const milestoneStatuses: Record<string, string> = {};
      for (const milestone of milestones) {
        const status = submissionByMilestone[milestone.id] ?? "PENDING";
        milestoneStatuses[milestone.title] = status;
      }

      rows.push({
        nim: user.nim ?? "-",
        name: user.name ?? user.username,
        groupName: group.name,
        commitCount,
        prOpenedCount,
        prMergedCount,
        reviewCount,
        activeDays,
        nonCodeNotes,
        milestoneStatuses,
      });
    }
  }

  return { milestones, rows };
}


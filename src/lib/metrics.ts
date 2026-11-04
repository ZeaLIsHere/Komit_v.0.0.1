import { db } from "@/lib/db";
import { truncateToWeek } from "@/lib/week";

export interface MemberWeeklyMetric {
  week: Date;
  weekLabel: string;
  commits: number;
  prsOpened: number;
  prsMerged: number;
  reviews: number;
  issues: number;
  activeDays: number;
  nonCodeCount: number;
}

export interface MemberMetricsSummary {
  userId: string;
  name: string;
  nim?: string | null;
  username: string;
  isLeader: boolean;
  totalCommits: number;
  totalPrs: number;
  totalReviews: number;
  totalIssues: number;
  totalActiveDays: number;
  flags: {
    type: "INACTIVE_WEEKS" | "LOW_ACTIVITY";
    message: string;
  }[];
  weekly: MemberWeeklyMetric[];
  nonCodeContributions: {
    id: string;
    description: string;
    week: Date;
    createdAt: Date;
  }[];
}

export interface GroupWeeklyMetric {
  week: Date;
  weekLabel: string;
  commits: number;
  prs: number;
  reviews: number;
  issues: number;
  totalEvents: number;
  activeMembers: number;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  githubAuthor: string;
  userName?: string | null;
  sha?: string | null;
  title?: string | null;
  occurredAt: Date;
  isFiltered: boolean;
}

function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Aggregates weekly metrics per student member in a group.
 */
export async function getMemberMetrics(
  groupId: string,
  weeksLimit = 6
): Promise<MemberMetricsSummary[]> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      repositories: { select: { id: true } },
      memberships: {
        include: {
          user: true,
          nonCodeContributions: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!group || group.memberships.length === 0) {
    return [];
  }

  const repoIds = group.repositories.map((r) => r.id);

  // Generate week intervals starting from current week going back weeksLimit
  const weeks: Date[] = [];
  const currentMonday = truncateToWeek(new Date());

  for (let i = 0; i < weeksLimit; i++) {
    const d = new Date(currentMonday);
    d.setUTCDate(d.getUTCDate() - i * 7);
    weeks.push(d);
  }

  // Fetch all non-filtered activity events in these repos
  const events = repoIds.length > 0
    ? await db.activityEvent.findMany({
        where: {
          repoId: { in: repoIds },
          userId: { not: null },
          isFiltered: false,
          week: { gte: weeks[weeks.length - 1] },
        },
        select: {
          userId: true,
          type: true,
          occurredAt: true,
          week: true,
        },
      })
    : [];

  // Group events by userId and week
  const eventMap = new Map<string, typeof events>();

  for (const ev of events) {
    if (!ev.userId) continue;
    const key = `${ev.userId}_${ev.week.toISOString()}`;
    if (!eventMap.has(key)) {
      eventMap.set(key, []);
    }
    eventMap.get(key)!.push(ev);
  }

  const result: MemberMetricsSummary[] = [];

  for (const m of group.memberships) {
    const user = m.user;
    const weeklyMetrics: MemberWeeklyMetric[] = [];

    let totalCommits = 0;
    let totalPrs = 0;
    let totalReviews = 0;
    let totalIssues = 0;
    const allActiveDates = new Set<string>();

    let consecutiveInactiveWeeks = 0;
    let currentlyInactive = true;

    for (const week of weeks) {
      const key = `${user.id}_${week.toISOString()}`;
      const weekEvents = eventMap.get(key) || [];

      let commits = 0;
      let prsOpened = 0;
      let prsMerged = 0;
      let reviews = 0;
      let issues = 0;
      const weekActiveDates = new Set<string>();

      for (const ev of weekEvents) {
        const dateStr = ev.occurredAt.toISOString().split("T")[0];
        weekActiveDates.add(dateStr);
        allActiveDates.add(dateStr);

        switch (ev.type) {
          case "COMMIT":
            commits++;
            break;
          case "PR_OPENED":
            prsOpened++;
            break;
          case "PR_MERGED":
            prsMerged++;
            break;
          case "PR_REVIEW":
          case "PR_COMMENT":
            reviews++;
            break;
          case "ISSUE_OPENED":
          case "ISSUE_CLOSED":
          case "ISSUE_COMMENT":
            issues++;
            break;
        }
      }

      const nonCodeThisWeek = m.nonCodeContributions.filter(
        (c) => c.week.getTime() === week.getTime()
      ).length;

      const totalWeekEvents = commits + prsOpened + prsMerged + reviews + issues + nonCodeThisWeek;

      if (totalWeekEvents === 0 && currentlyInactive) {
        consecutiveInactiveWeeks++;
      } else {
        currentlyInactive = false;
      }

      totalCommits += commits;
      totalPrs += prsOpened + prsMerged;
      totalReviews += reviews;
      totalIssues += issues;

      weeklyMetrics.push({
        week,
        weekLabel: formatWeekLabel(week),
        commits,
        prsOpened,
        prsMerged,
        reviews,
        issues,
        activeDays: weekActiveDates.size,
        nonCodeCount: nonCodeThisWeek,
      });
    }

    // Member flags (F-52)
    const flags: MemberMetricsSummary["flags"] = [];
    if (consecutiveInactiveWeeks >= 2) {
      flags.push({
        type: "INACTIVE_WEEKS",
        message: `Tidak ada aktivitas selama ${consecutiveInactiveWeeks} minggu terakhir`,
      });
    }

    result.push({
      userId: user.id,
      name: user.name || user.username,
      nim: user.nim,
      username: user.username,
      isLeader: m.isLeader,
      totalCommits,
      totalPrs,
      totalReviews,
      totalIssues,
      totalActiveDays: allActiveDates.size,
      flags,
      weekly: weeklyMetrics,
      nonCodeContributions: m.nonCodeContributions.map((c) => ({
        id: c.id,
        description: c.description,
        week: c.week,
        createdAt: c.createdAt,
      })),
    });
  }

  return result;
}

/**
 * Aggregates group-level weekly activity metrics.
 */
export async function getGroupMetrics(
  groupId: string,
  weeksLimit = 8
): Promise<GroupWeeklyMetric[]> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { repositories: { select: { id: true } } },
  });

  if (!group || group.repositories.length === 0) {
    return [];
  }

  const repoIds = group.repositories.map((r) => r.id);

  const weeks: Date[] = [];
  const currentMonday = truncateToWeek(new Date());

  for (let i = weeksLimit - 1; i >= 0; i--) {
    const d = new Date(currentMonday);
    d.setUTCDate(d.getUTCDate() - i * 7);
    weeks.push(d);
  }

  const events = await db.activityEvent.findMany({
    where: {
      repoId: { in: repoIds },
      isFiltered: false,
      week: { gte: weeks[0] },
    },
    select: {
      userId: true,
      type: true,
      week: true,
    },
  });

  const weekMap = new Map<string, typeof events>();

  for (const ev of events) {
    const key = ev.week.toISOString();
    if (!weekMap.has(key)) {
      weekMap.set(key, []);
    }
    weekMap.get(key)!.push(ev);
  }

  return weeks.map((week) => {
    const evs = weekMap.get(week.toISOString()) || [];
    let commits = 0;
    let prs = 0;
    let reviews = 0;
    let issues = 0;
    const activeMembers = new Set<string>();

    for (const ev of evs) {
      if (ev.userId) {
        activeMembers.add(ev.userId);
      }

      switch (ev.type) {
        case "COMMIT":
          commits++;
          break;
        case "PR_OPENED":
        case "PR_MERGED":
          prs++;
          break;
        case "PR_REVIEW":
        case "PR_COMMENT":
          reviews++;
          break;
        case "ISSUE_OPENED":
        case "ISSUE_CLOSED":
        case "ISSUE_COMMENT":
          issues++;
          break;
      }
    }

    return {
      week,
      weekLabel: formatWeekLabel(week),
      commits,
      prs,
      reviews,
      issues,
      totalEvents: evs.length,
      activeMembers: activeMembers.size,
    };
  });
}

/**
 * Returns latest 10 commits / PRs / reviews / issues in the group.
 */
export async function getRecentActivity(
  groupId: string,
  limit = 10
): Promise<RecentActivityItem[]> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { repositories: { select: { id: true } } },
  });

  if (!group || group.repositories.length === 0) {
    return [];
  }

  const repoIds = group.repositories.map((r) => r.id);

  const events = await db.activityEvent.findMany({
    where: {
      repoId: { in: repoIds },
    },
    include: {
      repo: { select: { fullName: true } },
    },
    orderBy: {
      occurredAt: "desc",
    },
    take: limit,
  });

  // Get user details for events with userId
  const userIds = events.map((e) => e.userId).filter((id): id is string => Boolean(id));
  const users = userIds.length > 0
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, username: true },
      })
    : [];

  const userMap = new Map(users.map((u) => [u.id, u.name || u.username]));

  return events.map((e) => {
    const meta = (e.metadata as Record<string, any>) || {};
    return {
      id: e.id,
      type: e.type,
      githubAuthor: e.githubAuthor,
      userName: e.userId ? userMap.get(e.userId) || null : null,
      sha: e.sha,
      title: meta.message || meta.title || e.type,
      occurredAt: e.occurredAt,
      isFiltered: e.isFiltered,
    };
  });
}

/**
 * Returns total count of unmapped events for a group.
 */
export async function getUnmappedCount(groupId: string): Promise<number> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { repositories: { select: { id: true } } },
  });

  if (!group || group.repositories.length === 0) {
    return 0;
  }

  const repoIds = group.repositories.map((r) => r.id);

  return db.activityEvent.count({
    where: {
      repoId: { in: repoIds },
      userId: null,
    },
  });
}

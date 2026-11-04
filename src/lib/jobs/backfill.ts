import { db } from "@/lib/db";
import { getBoss } from "@/lib/worker";
import { truncateToWeek } from "@/lib/week";
import {
  generateInstallationToken,
  fetchCommits,
  fetchPullRequests,
  fetchIssues,
} from "@/lib/github";
import { isNoiseCommit } from "@/lib/noise-filter";
import { autoMapIdentity } from "@/lib/identity";

export interface BackfillJobPayload {
  repoId: string;
  installationId: string | number;
}

/**
 * Backfills commit, PR, review, and issue history when a repository is first connected.
 */
export async function backfillRepo(job: { data: BackfillJobPayload }): Promise<void> {
  const { repoId, installationId } = job.data;

  const repo = await db.repository.findUnique({
    where: { id: repoId },
    include: {
      group: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!repo) {
    console.warn(`[Backfill] Repository ${repoId} tidak ditemukan.`);
    return;
  }

  const [owner, repoName] = repo.fullName.split("/");
  if (!owner || !repoName) {
    throw new Error(`Invalid repo.fullName format: ${repo.fullName}`);
  }

  const token = await generateInstallationToken(installationId);
  const excludePatterns = (repo.group.course.excludePatterns as string[]) || [];

  let latestActivityDate: Date | null = repo.group.lastActivityAt || null;

  // 1. Fetch & Store Commits
  const { commits, rateLimit: commitRateLimit } = await fetchCommits(token, owner, repoName, {
    maxCommits: 1000,
  });

  for (const commit of commits) {
    const isFiltered = isNoiseCommit({
      message: commit.message,
      files: commit.files,
      excludePatterns,
    });

    const userId = await autoMapIdentity(
      {
        username: commit.authorUsername,
        email: commit.authorEmail,
        name: commit.authorName,
      },
      repo.id
    );

    const week = truncateToWeek(commit.date);

    // Upsert or create idempotent event
    await db.activityEvent.upsert({
      where: {
        repoId_type_sha: {
          repoId: repo.id,
          type: "COMMIT",
          sha: commit.sha,
        },
      },
      create: {
        repoId: repo.id,
        type: "COMMIT",
        sha: commit.sha,
        githubAuthor: commit.authorUsername || commit.authorEmail || commit.authorName || "unknown",
        userId,
        occurredAt: commit.date,
        week,
        isFiltered,
        linesAdded: commit.linesAdded,
        linesRemoved: commit.linesRemoved,
        metadata: {
          message: commit.message,
        },
      },
      update: {
        userId: userId ?? undefined,
        isFiltered,
      },
    });

    if (!latestActivityDate || commit.date > latestActivityDate) {
      latestActivityDate = commit.date;
    }
  }

  // Check rate limit after commits
  if (commitRateLimit.isRateLimited) {
    console.warn(`[Backfill] Rate limit GitHub tercapai. Menjadwalkan ulang setelah ${commitRateLimit.resetAt}`);
    const boss = getBoss();
    if (boss) {
      await boss.send("backfill", job.data, {
        startAfter: Math.ceil((commitRateLimit.resetAt.getTime() - Date.now()) / 1000),
      });
    }
    return;
  }

  // 2. Fetch & Store Pull Requests & Reviews
  const { prs, reviews, rateLimit: prRateLimit } = await fetchPullRequests(token, owner, repoName);

  for (const pr of prs) {
    const userId = await autoMapIdentity({ username: pr.authorUsername }, repo.id);
    const week = truncateToWeek(pr.createdAt);

    // PR Opened event
    await db.activityEvent.upsert({
      where: {
        repoId_type_sha: {
          repoId: repo.id,
          type: "PR_OPENED",
          sha: `pr-opened-${pr.id}`,
        },
      },
      create: {
        repoId: repo.id,
        type: "PR_OPENED",
        sha: `pr-opened-${pr.id}`,
        githubAuthor: pr.authorUsername,
        userId,
        occurredAt: pr.createdAt,
        week,
        isFiltered: false,
        metadata: {
          number: pr.number,
          title: pr.title,
        },
      },
      update: {},
    });

    if (!latestActivityDate || pr.createdAt > latestActivityDate) {
      latestActivityDate = pr.createdAt;
    }

    // PR Merged event
    if (pr.mergedAt) {
      const mergedWeek = truncateToWeek(pr.mergedAt);
      await db.activityEvent.upsert({
        where: {
          repoId_type_sha: {
            repoId: repo.id,
            type: "PR_MERGED",
            sha: `pr-merged-${pr.id}`,
          },
        },
        create: {
          repoId: repo.id,
          type: "PR_MERGED",
          sha: `pr-merged-${pr.id}`,
          // Squash merge attribution goes to PR author (F-34)
          githubAuthor: pr.authorUsername,
          userId,
          occurredAt: pr.mergedAt,
          week: mergedWeek,
          isFiltered: false,
          metadata: {
            number: pr.number,
            title: pr.title,
            isSquash: pr.isSquashMerge,
          },
        },
        update: {},
      });

      if (!latestActivityDate || pr.mergedAt > latestActivityDate) {
        latestActivityDate = pr.mergedAt;
      }
    }
  }

  // Reviews
  for (const rev of reviews) {
    const revUserId = await autoMapIdentity({ username: rev.reviewerUsername }, repo.id);
    const revWeek = truncateToWeek(rev.submittedAt);

    await db.activityEvent.upsert({
      where: {
        repoId_type_sha: {
          repoId: repo.id,
          type: "PR_REVIEW",
          sha: `review-${rev.id}`,
        },
      },
      create: {
        repoId: repo.id,
        type: "PR_REVIEW",
        sha: `review-${rev.id}`,
        githubAuthor: rev.reviewerUsername,
        userId: revUserId,
        occurredAt: rev.submittedAt,
        week: revWeek,
        isFiltered: false,
        metadata: {
          pullNumber: rev.pullNumber,
          state: rev.state,
        },
      },
      update: {},
    });

    if (!latestActivityDate || rev.submittedAt > latestActivityDate) {
      latestActivityDate = rev.submittedAt;
    }
  }

  if (prRateLimit.isRateLimited) {
    console.warn(`[Backfill] Rate limit GitHub mendekati batas saat PR review.`);
  }

  // 3. Fetch & Store Issues
  const { issues } = await fetchIssues(token, owner, repoName);

  for (const issue of issues) {
    const issueUserId = await autoMapIdentity({ username: issue.authorUsername }, repo.id);
    const issueWeek = truncateToWeek(issue.createdAt);

    // Issue Opened
    await db.activityEvent.upsert({
      where: {
        repoId_type_sha: {
          repoId: repo.id,
          type: "ISSUE_OPENED",
          sha: `issue-opened-${issue.id}`,
        },
      },
      create: {
        repoId: repo.id,
        type: "ISSUE_OPENED",
        sha: `issue-opened-${issue.id}`,
        githubAuthor: issue.authorUsername,
        userId: issueUserId,
        occurredAt: issue.createdAt,
        week: issueWeek,
        isFiltered: false,
        metadata: {
          number: issue.number,
          title: issue.title,
        },
      },
      update: {},
    });

    if (!latestActivityDate || issue.createdAt > latestActivityDate) {
      latestActivityDate = issue.createdAt;
    }

    // Issue Closed
    if (issue.closedAt) {
      const closedWeek = truncateToWeek(issue.closedAt);
      await db.activityEvent.upsert({
        where: {
          repoId_type_sha: {
            repoId: repo.id,
            type: "ISSUE_CLOSED",
            sha: `issue-closed-${issue.id}`,
          },
        },
        create: {
          repoId: repo.id,
          type: "ISSUE_CLOSED",
          sha: `issue-closed-${issue.id}`,
          githubAuthor: issue.authorUsername,
          userId: issueUserId,
          occurredAt: issue.closedAt,
          week: closedWeek,
          isFiltered: false,
          metadata: {
            number: issue.number,
            title: issue.title,
          },
        },
        update: {},
      });

      if (!latestActivityDate || issue.closedAt > latestActivityDate) {
        latestActivityDate = issue.closedAt;
      }
    }
  }

  // 4. Update Repository and Group statuses
  await db.repository.update({
    where: { id: repo.id },
    data: {
      backfillDoneAt: new Date(),
      connectionStatus: "CONNECTED",
    },
  });

  if (latestActivityDate) {
    await db.group.update({
      where: { id: repo.groupId },
      data: {
        lastActivityAt: latestActivityDate,
      },
    });
  }

  console.log(`[Backfill] Berhasil menyelesaikan backfill untuk repo ${repo.fullName}`);
}


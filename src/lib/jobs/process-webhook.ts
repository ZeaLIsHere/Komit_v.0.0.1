import { db } from "@/lib/db";
import { truncateToWeek } from "@/lib/week";
import { isNoiseCommit } from "@/lib/noise-filter";
import { autoMapIdentity } from "@/lib/identity";

export interface ProcessWebhookJobPayload {
  eventType: string;
  body: any;
  repoId: string;
}

/**
 * Parses Co-authored-by trailers in commit message.
 * Format: Co-authored-by: Name <email@example.com>
 */
function parseCoAuthors(message: string): { name: string; email: string }[] {
  const coAuthors: { name: string; email: string }[] = [];
  const regex = /^Co-authored-by:\s*(.*?)\s*<([^>]+)>/gim;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(message)) !== null) {
    if (match[1] && match[2]) {
      coAuthors.push({
        name: match[1].trim(),
        email: match[2].trim(),
      });
    }
  }

  return coAuthors;
}

/**
 * Worker handler to process incoming GitHub webhook events idempotently.
 */
export async function processWebhookEvent(job: { data: ProcessWebhookJobPayload }): Promise<void> {
  const { eventType, body, repoId } = job.data;

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
    console.warn(`[Webhook Job] Repository ${repoId} tidak ditemukan.`);
    return;
  }

  const excludePatterns = (repo.group.course.excludePatterns as string[]) || [];
  let latestActivityDate: Date | null = null;

  switch (eventType) {
    case "push": {
      const commits = Array.isArray(body.commits) ? body.commits : [];

      for (const commit of commits) {
        const commitDate = new Date(commit.timestamp || Date.now());
        const week = truncateToWeek(commitDate);

        // Files changed in this commit
        const changedFiles = [
          ...(commit.added || []),
          ...(commit.modified || []),
          ...(commit.removed || []),
        ];

        const isFiltered = isNoiseCommit({
          message: commit.message,
          files: changedFiles,
          excludePatterns,
        });

        const userId = await autoMapIdentity(
          {
            username: commit.author?.username,
            email: commit.author?.email,
            name: commit.author?.name,
          },
          repo.id
        );

        // Upsert commit event
        await db.activityEvent.upsert({
          where: {
            repoId_type_sha: {
              repoId: repo.id,
              type: "COMMIT",
              sha: commit.id,
            },
          },
          create: {
            repoId: repo.id,
            type: "COMMIT",
            sha: commit.id,
            githubAuthor: commit.author?.username || commit.author?.email || commit.author?.name || "unknown",
            userId,
            occurredAt: commitDate,
            week,
            isFiltered,
            metadata: {
              message: commit.message,
            },
          },
          update: {
            userId: userId ?? undefined,
            isFiltered,
          },
        });

        // Co-authored-by support (F-33)
        const coAuthors = parseCoAuthors(commit.message || "");
        for (let i = 0; i < coAuthors.length; i++) {
          const coAuthor = coAuthors[i];
          const coAuthorUserId = await autoMapIdentity(
            { email: coAuthor.email, name: coAuthor.name },
            repo.id
          );

          await db.activityEvent.upsert({
            where: {
              repoId_type_sha: {
                repoId: repo.id,
                type: "COMMIT",
                sha: `${commit.id}-coauthor-${i}`,
              },
            },
            create: {
              repoId: repo.id,
              type: "COMMIT",
              sha: `${commit.id}-coauthor-${i}`,
              githubAuthor: coAuthor.name || coAuthor.email,
              userId: coAuthorUserId,
              occurredAt: commitDate,
              week,
              isFiltered,
              metadata: {
                message: commit.message,
                isCoAuthor: true,
                parentSha: commit.id,
              },
            },
            update: {
              userId: coAuthorUserId ?? undefined,
            },
          });
        }

        if (!latestActivityDate || commitDate > latestActivityDate) {
          latestActivityDate = commitDate;
        }
      }
      break;
    }

    case "pull_request": {
      const action = body.action;
      const pr = body.pull_request;
      if (!pr) break;

      const prAuthor = pr.user?.login || "unknown";
      const prUserId = await autoMapIdentity({ username: prAuthor }, repo.id);

      if (action === "opened") {
        const createdAt = new Date(pr.created_at || Date.now());
        const week = truncateToWeek(createdAt);

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
            githubAuthor: prAuthor,
            userId: prUserId,
            occurredAt: createdAt,
            week,
            isFiltered: false,
            metadata: {
              number: pr.number,
              title: pr.title,
            },
          },
          update: {},
        });

        if (!latestActivityDate || createdAt > latestActivityDate) {
          latestActivityDate = createdAt;
        }
      } else if (action === "closed" && pr.merged) {
        const mergedAt = new Date(pr.merged_at || Date.now());
        const week = truncateToWeek(mergedAt);

        // Squash merge attribution to PR author (F-34)
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
            githubAuthor: prAuthor,
            userId: prUserId,
            occurredAt: mergedAt,
            week,
            isFiltered: false,
            metadata: {
              number: pr.number,
              title: pr.title,
              mergeCommitSha: pr.merge_commit_sha,
            },
          },
          update: {},
        });

        // If the squash commit was already pushed, attribute it to the PR author rather than the merger
        if (pr.merge_commit_sha && prUserId) {
          await db.activityEvent.updateMany({
            where: {
              repoId: repo.id,
              type: "COMMIT",
              sha: pr.merge_commit_sha,
            },
            data: {
              userId: prUserId,
            },
          });
        }

        if (!latestActivityDate || mergedAt > latestActivityDate) {
          latestActivityDate = mergedAt;
        }
      }
      break;
    }

    case "pull_request_review": {
      const review = body.review;
      if (!review) break;

      const reviewer = review.user?.login || "unknown";
      const reviewerUserId = await autoMapIdentity({ username: reviewer }, repo.id);
      const submittedAt = new Date(review.submitted_at || Date.now());
      const week = truncateToWeek(submittedAt);

      await db.activityEvent.upsert({
        where: {
          repoId_type_sha: {
            repoId: repo.id,
            type: "PR_REVIEW",
            sha: `review-${review.id}`,
          },
        },
        create: {
          repoId: repo.id,
          type: "PR_REVIEW",
          sha: `review-${review.id}`,
          githubAuthor: reviewer,
          userId: reviewerUserId,
          occurredAt: submittedAt,
          week,
          isFiltered: false,
          metadata: {
            pullNumber: body.pull_request?.number,
            state: review.state,
          },
        },
        update: {},
      });

      if (!latestActivityDate || submittedAt > latestActivityDate) {
        latestActivityDate = submittedAt;
      }
      break;
    }

    case "issues": {
      const action = body.action;
      const issue = body.issue;
      if (!issue || issue.pull_request) break; // Exclude PRs

      const author = issue.user?.login || "unknown";
      const userId = await autoMapIdentity({ username: author }, repo.id);

      if (action === "opened") {
        const createdAt = new Date(issue.created_at || Date.now());
        const week = truncateToWeek(createdAt);

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
            githubAuthor: author,
            userId,
            occurredAt: createdAt,
            week,
            isFiltered: false,
            metadata: {
              number: issue.number,
              title: issue.title,
            },
          },
          update: {},
        });

        if (!latestActivityDate || createdAt > latestActivityDate) {
          latestActivityDate = createdAt;
        }
      } else if (action === "closed") {
        const closedAt = new Date(issue.closed_at || Date.now());
        const week = truncateToWeek(closedAt);

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
            githubAuthor: author,
            userId,
            occurredAt: closedAt,
            week,
            isFiltered: false,
            metadata: {
              number: issue.number,
              title: issue.title,
            },
          },
          update: {},
        });

        if (!latestActivityDate || closedAt > latestActivityDate) {
          latestActivityDate = closedAt;
        }
      }
      break;
    }

    case "issue_comment": {
      const comment = body.comment;
      const issue = body.issue;
      if (!comment || !issue) break;

      const commenter = comment.user?.login || "unknown";
      const userId = await autoMapIdentity({ username: commenter }, repo.id);
      const createdAt = new Date(comment.created_at || Date.now());
      const week = truncateToWeek(createdAt);

      const eventType = issue.pull_request ? "PR_COMMENT" : "ISSUE_COMMENT";

      await db.activityEvent.upsert({
        where: {
          repoId_type_sha: {
            repoId: repo.id,
            type: eventType,
            sha: `comment-${comment.id}`,
          },
        },
        create: {
          repoId: repo.id,
          type: eventType,
          sha: `comment-${comment.id}`,
          githubAuthor: commenter,
          userId,
          occurredAt: createdAt,
          week,
          isFiltered: false,
          metadata: {
            issueNumber: issue.number,
          },
        },
        update: {},
      });

      if (!latestActivityDate || createdAt > latestActivityDate) {
        latestActivityDate = createdAt;
      }
      break;
    }

    default:
      // Other unhandled events
      break;
  }

  // Update lastActivityAt on Group
  if (latestActivityDate) {
    const currentGroup = await db.group.findUnique({
      where: { id: repo.groupId },
      select: { lastActivityAt: true },
    });

    if (!currentGroup?.lastActivityAt || latestActivityDate > currentGroup.lastActivityAt) {
      await db.group.update({
        where: { id: repo.groupId },
        data: {
          lastActivityAt: latestActivityDate,
        },
      });
    }
  }
}


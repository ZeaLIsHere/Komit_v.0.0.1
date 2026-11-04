import crypto from "crypto";

export interface GitHubCommitAuthor {
  name?: string;
  email?: string;
  date?: string;
}

export interface NormalizedCommit {
  sha: string;
  message: string;
  authorUsername?: string | null;
  authorEmail?: string | null;
  authorName?: string | null;
  date: Date;
  linesAdded?: number;
  linesRemoved?: number;
  files?: string[];
}

export interface NormalizedPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  authorUsername: string;
  mergedAt?: Date | null;
  createdAt: Date;
  isSquashMerge?: boolean;
  mergeCommitSha?: string | null;
  coAuthors?: { name?: string; email?: string }[];
}

export interface NormalizedReview {
  id: number;
  pullNumber: number;
  reviewerUsername: string;
  state: string;
  submittedAt: Date;
}

export interface NormalizedIssue {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  authorUsername: string;
  createdAt: Date;
  closedAt?: Date | null;
}

export interface RateLimitStatus {
  remaining: number;
  resetAt: Date;
  isRateLimited: boolean;
}

// In-memory token cache: Map<installationId, { token: string; expiresAt: Date }>
const tokenCache = new Map<string, { token: string; expiresAt: Date }>();

/**
 * Creates an RS256 JWT for GitHub App authentication using native Node.js crypto.
 */
function createGitHubAppJwt(): string {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("GITHUB_APP_ID atau GITHUB_PRIVATE_KEY belum dikonfigurasi di environment");
  }

  // Format private key if escaped newlines are present
  const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iat: now - 60, // 60s in the past to allow for clock drift
      exp: now + 9 * 60, // 9 minutes expiration
      iss: appId,
    })
  ).toString("base64url");

  const unsignedToken = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(formattedPrivateKey, "base64url");
  return `${unsignedToken}.${signature}`;
}

/**
 * Generates or retrieves a cached GitHub App installation access token.
 */
export async function generateInstallationToken(
  installationId: string | number
): Promise<string> {
  const cacheKey = String(installationId);
  const cached = tokenCache.get(cacheKey);

  // Re-use token if it has more than 5 minutes remaining
  if (cached && cached.expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return cached.token;
  }

  const appJwt = createGitHubAppJwt();
  const url = `https://api.github.com/app/installations/${installationId}/access_tokens`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appJwt}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Komit-Platform",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mendapatkan installation token dari GitHub: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const token = data.token as string;
  const expiresAt = new Date(data.expires_at as string);

  tokenCache.set(cacheKey, { token, expiresAt });
  return token;
}

/**
 * Checks remaining rate limit headers from a GitHub API response.
 */
export function checkRateLimit(headers: Headers): RateLimitStatus {
  const remainingHeader = headers.get("x-ratelimit-remaining");
  const resetHeader = headers.get("x-ratelimit-reset");

  const remaining = remainingHeader ? parseInt(remainingHeader, 10) : 5000;
  const resetTimestamp = resetHeader ? parseInt(resetHeader, 10) * 1000 : Date.now() + 60000;
  const resetAt = new Date(resetTimestamp);

  return {
    remaining,
    resetAt,
    isRateLimited: remaining < 10,
  };
}

/**
 * Fetches commits from a GitHub repository with pagination (up to maxCommits).
 */
export async function fetchCommits(
  token: string,
  owner: string,
  repo: string,
  options: { maxCommits?: number; since?: string } = {}
): Promise<{ commits: NormalizedCommit[]; rateLimit: RateLimitStatus }> {
  const maxCommits = options.maxCommits || 1000;
  const perPage = 100;
  const commits: NormalizedCommit[] = [];
  let page = 1;
  let lastRateLimit: RateLimitStatus = { remaining: 5000, resetAt: new Date(), isRateLimited: false };

  while (commits.length < maxCommits) {
    let url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`;
    if (options.since) {
      url += `&since=${encodeURIComponent(options.since)}`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Komit-Platform",
      },
    });

    lastRateLimit = checkRateLimit(res.headers);

    if (!res.ok) {
      if (res.status === 409) {
        // Git Repository is empty
        break;
      }
      throw new Error(`GitHub fetchCommits error (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    for (const item of data) {
      commits.push({
        sha: item.sha,
        message: item.commit?.message || "",
        authorUsername: item.author?.login || null,
        authorEmail: item.commit?.author?.email || null,
        authorName: item.commit?.author?.name || null,
        date: new Date(item.commit?.author?.date || Date.now()),
      });

      if (commits.length >= maxCommits) break;
    }

    if (data.length < perPage || lastRateLimit.isRateLimited) {
      break;
    }

    page++;
  }

  return { commits, rateLimit: lastRateLimit };
}

/**
 * Fetches pull requests and their associated reviews.
 */
export async function fetchPullRequests(
  token: string,
  owner: string,
  repo: string
): Promise<{ prs: NormalizedPullRequest[]; reviews: NormalizedReview[]; rateLimit: RateLimitStatus }> {
  const prs: NormalizedPullRequest[] = [];
  const reviews: NormalizedReview[] = [];
  let page = 1;
  let lastRateLimit: RateLimitStatus = { remaining: 5000, resetAt: new Date(), isRateLimited: false };

  while (page <= 5) {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Komit-Platform",
      },
    });

    lastRateLimit = checkRateLimit(res.headers);
    if (!res.ok) break;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    for (const item of data) {
      const isSquash = item.merged_at && item.title?.includes("(#") ? true : false;

      prs.push({
        id: item.id,
        number: item.number,
        title: item.title || "",
        state: item.state,
        authorUsername: item.user?.login || "unknown",
        createdAt: new Date(item.created_at),
        mergedAt: item.merged_at ? new Date(item.merged_at) : null,
        isSquashMerge: isSquash,
        mergeCommitSha: item.merge_commit_sha || null,
      });

      // Fetch reviews for this PR
      if (item.number) {
        try {
          const revRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${item.number}/reviews?per_page=100`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "Komit-Platform",
              },
            }
          );
          if (revRes.ok) {
            const revData = await revRes.json();
            if (Array.isArray(revData)) {
              for (const rev of revData) {
                reviews.push({
                  id: rev.id,
                  pullNumber: item.number,
                  reviewerUsername: rev.user?.login || "unknown",
                  state: rev.state,
                  submittedAt: new Date(rev.submitted_at || Date.now()),
                });
              }
            }
          }
        } catch {
          // Non-critical, continue
        }
      }
    }

    if (data.length < 100 || lastRateLimit.isRateLimited) break;
    page++;
  }

  return { prs, reviews, rateLimit: lastRateLimit };
}

/**
 * Fetches issues, filtering out pull requests.
 */
export async function fetchIssues(
  token: string,
  owner: string,
  repo: string
): Promise<{ issues: NormalizedIssue[]; rateLimit: RateLimitStatus }> {
  const issues: NormalizedIssue[] = [];
  let page = 1;
  let lastRateLimit: RateLimitStatus = { remaining: 5000, resetAt: new Date(), isRateLimited: false };

  while (page <= 5) {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Komit-Platform",
      },
    });

    lastRateLimit = checkRateLimit(res.headers);
    if (!res.ok) break;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    for (const item of data) {
      // GitHub API combines PRs into issues list; filter them out
      if (item.pull_request) continue;

      issues.push({
        id: item.id,
        number: item.number,
        title: item.title || "",
        state: item.state === "closed" ? "closed" : "open",
        authorUsername: item.user?.login || "unknown",
        createdAt: new Date(item.created_at),
        closedAt: item.closed_at ? new Date(item.closed_at) : null,
      });
    }

    if (data.length < 100 || lastRateLimit.isRateLimited) break;
    page++;
  }

  return { issues, rateLimit: lastRateLimit };
}

/**
 * Verifies webhook payload signature using HMAC-SHA256.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const signature = signatureHeader.substring("sha256=".length);
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}


import { GitHubUser } from "../types";

const GITHUB_API = "https://api.github.com";

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevPulse",
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

let lastRateLimitRemaining: number | null = null;

export function getRateLimitRemaining(): number | null {
  return lastRateLimitRemaining;
}

async function ghFetch(url: string): Promise<any> {
  const res = await fetch(url, { headers: headers() });

  const remaining = res.headers.get("x-ratelimit-remaining");
  if (remaining !== null) {
    lastRateLimitRemaining = parseInt(remaining, 10);
  }

  if (res.status === 403 || res.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  if (res.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  return res.json();
}

function thirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchCount(query: string): Promise<number> {
  try {
    const data = await ghFetch(
      `${GITHUB_API}/search/issues?q=${encodeURIComponent(query)}&per_page=1`
    );
    return data.total_count ?? 0;
  } catch (e: any) {
    if (e.message === "RATE_LIMITED") throw e;
    return 0;
  }
}

async function searchCommitCount(username: string): Promise<number> {
  const since = thirtyDaysAgo();
  try {
    const data = await ghFetch(
      `${GITHUB_API}/search/commits?q=${encodeURIComponent(
        `author:${username} committer-date:>${since}`
      )}&per_page=1`
    );
    return data.total_count ?? 0;
  } catch (e: any) {
    if (e.message === "RATE_LIMITED") throw e;
    return 0;
  }
}

// GitHub Search API has a secondary rate limit (~30 req/min) that triggers
// on concurrent requests. Run searches sequentially with a short delay.
export async function fetchGitHubUser(
  username: string
): Promise<GitHubUser> {
  const profile = await ghFetch(`${GITHUB_API}/users/${username}`);

  const since = thirtyDaysAgo();

  const commits = await searchCommitCount(username);
  await delay(1500);
  const prsOpened = await searchCount(`author:${username} type:pr created:>${since}`);
  await delay(1500);
  const prsMerged = await searchCount(`author:${username} type:pr is:merged created:>${since}`);
  await delay(1500);
  const issues = await searchCount(`author:${username} type:issue created:>${since}`);

  const activity_score =
    commits * 3 + prsMerged * 5 + prsOpened * 2 + issues * 1;

  const now = new Date().toISOString();

  return {
    username: username.toLowerCase(),
    display_name: profile.name || null,
    avatar_url: profile.avatar_url || null,
    followers: profile.followers ?? 0,
    commits_30d: commits,
    prs_opened_30d: prsOpened,
    prs_merged_30d: prsMerged,
    issues_30d: issues,
    activity_score,
    cached_at: now,
    updated_at: now,
    from_cache: false,
  };
}

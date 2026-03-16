const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface GitHubUser {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followers: number;
  commits_30d: number;
  prs_opened_30d: number;
  prs_merged_30d: number;
  issues_30d: number;
  activity_score: number;
  cached_at: string;
  updated_at: string;
  not_found?: boolean;
  from_cache?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    github_rate_limit_remaining?: number;
    cached_count?: number;
    fetched_count?: number;
  };
  error?: string;
}

export async function fetchLeaderboard(
  usernames: string[]
): Promise<ApiResponse<GitHubUser[]>> {
  const res = await fetch(`${API_URL}/api/v1/leaderboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames }),
  });
  return res.json();
}

export async function fetchUser(
  username: string
): Promise<ApiResponse<GitHubUser>> {
  const res = await fetch(`${API_URL}/api/v1/user/${encodeURIComponent(username)}`);
  return res.json();
}

export async function fetchDocs(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/api/v1/docs`);
  return res.json();
}

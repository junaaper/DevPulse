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

export interface LeaderboardRequest {
  usernames: string[];
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

export interface CachedRow {
  id: string;
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
}

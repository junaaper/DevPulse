import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CachedRow, GitHubUser } from "../types";

let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function getCached(
  username: string
): Promise<GitHubUser | null> {
  const client = getClient();
  const { data, error } = await client
    .from("github_cache")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !data) return null;

  const row = data as CachedRow;
  const cachedTime = new Date(row.cached_at).getTime();
  if (Date.now() - cachedTime > CACHE_TTL_MS) {
    return null; // expired
  }

  return {
    username: row.username,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    followers: row.followers,
    commits_30d: row.commits_30d,
    prs_opened_30d: row.prs_opened_30d,
    prs_merged_30d: row.prs_merged_30d,
    issues_30d: row.issues_30d,
    activity_score: row.activity_score,
    cached_at: row.cached_at,
    updated_at: row.updated_at,
    from_cache: true,
  };
}

export async function upsertCache(user: GitHubUser): Promise<void> {
  const client = getClient();
  const { error } = await client.from("github_cache").upsert(
    {
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      followers: user.followers,
      commits_30d: user.commits_30d,
      prs_opened_30d: user.prs_opened_30d,
      prs_merged_30d: user.prs_merged_30d,
      issues_30d: user.issues_30d,
      activity_score: user.activity_score,
      cached_at: user.cached_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "username" }
  );

  if (error) {
    console.error("Cache upsert error:", error.message);
  }
}

export async function getCachedStale(
  username: string
): Promise<GitHubUser | null> {
  const client = getClient();
  const { data, error } = await client
    .from("github_cache")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !data) return null;

  const row = data as CachedRow;
  return {
    username: row.username,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    followers: row.followers,
    commits_30d: row.commits_30d,
    prs_opened_30d: row.prs_opened_30d,
    prs_merged_30d: row.prs_merged_30d,
    issues_30d: row.issues_30d,
    activity_score: row.activity_score,
    cached_at: row.cached_at,
    updated_at: row.updated_at,
    from_cache: true,
  };
}

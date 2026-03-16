"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UsernameInput } from "@/components/UsernameInput";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { fetchLeaderboard, GitHubUser, ApiResponse } from "@/lib/api";

export default function Home() {
  const [users, setUsers] = useState<GitHubUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ApiResponse<GitHubUser[]>["meta"]>(undefined);

  async function handleSubmit(usernames: string[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLeaderboard(usernames);
      if (!res.success) {
        setError(res.error || "Something went wrong");
        return;
      }
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      setError("Could not reach the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          <span className="text-emerald-400">Dev</span>Pulse
        </h1>
        <p className="text-muted-foreground">
          GitHub Activity Leaderboard — rank developers by their contribution
          activity over the last 30 days.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter GitHub Usernames</CardTitle>
        </CardHeader>
        <CardContent>
          <UsernameInput onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[120px]" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Results</h2>
            {meta && (
              <div className="flex gap-3 text-xs text-muted-foreground">
                {(meta.cached_count ?? 0) > 0 && (
                  <span>{meta.cached_count} from cache</span>
                )}
                {(meta.fetched_count ?? 0) > 0 && (
                  <span>{meta.fetched_count} freshly fetched</span>
                )}
                {meta.github_rate_limit_remaining !== undefined && (
                  <span>
                    GitHub rate limit: {meta.github_rate_limit_remaining}{" "}
                    remaining
                  </span>
                )}
              </div>
            )}
          </div>
          <LeaderboardTable users={users} />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded bg-emerald-500" /> Commits (x3)
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded bg-blue-500" /> PRs Merged (x5)
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded bg-violet-500" /> PRs Opened (x2)
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded bg-amber-500" /> Issues (x1)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

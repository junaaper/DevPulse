"use client";

import { GitHubUser } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoreBreakdownBar } from "./ScoreBreakdownBar";

interface Props {
  users: GitHubUser[];
}

function rankStyle(rank: number): string {
  if (rank === 1) return "text-yellow-400 font-bold";
  if (rank === 2) return "text-gray-300 font-bold";
  if (rank === 3) return "text-amber-600 font-bold";
  return "text-muted-foreground";
}

function rankLabel(rank: number): string {
  if (rank === 1) return "#1";
  if (rank === 2) return "#2";
  if (rank === 3) return "#3";
  return `#${rank}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function LeaderboardTable({ users }: Props) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[60px]">Rank</TableHead>
            <TableHead>Developer</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              Commits
            </TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              PRs Merged
            </TableHead>
            <TableHead className="text-right hidden md:table-cell">
              PRs Opened
            </TableHead>
            <TableHead className="text-right hidden md:table-cell">
              Issues
            </TableHead>
            <TableHead className="hidden lg:table-cell w-[140px]">
              Breakdown
            </TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, i) => (
            <TableRow
              key={user.username}
              className={user.not_found ? "opacity-50" : ""}
            >
              <TableCell className={rankStyle(i + 1)}>
                {rankLabel(i + 1)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                      ?
                    </div>
                  )}
                  <div>
                    <a
                      href={`https://github.com/${user.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-emerald-400 transition-colors"
                    >
                      {user.username}
                    </a>
                    {user.display_name && (
                      <p className="text-xs text-muted-foreground">
                        {user.display_name}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-lg font-bold text-emerald-400">
                  {user.not_found ? "—" : user.activity_score}
                </span>
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell font-mono text-sm">
                {user.commits_30d}
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell font-mono text-sm">
                {user.prs_merged_30d}
              </TableCell>
              <TableCell className="text-right hidden md:table-cell font-mono text-sm">
                {user.prs_opened_30d}
              </TableCell>
              <TableCell className="text-right hidden md:table-cell font-mono text-sm">
                {user.issues_30d}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <ScoreBreakdownBar user={user} />
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell">
                <div className="flex flex-col items-end gap-1">
                  {user.not_found ? (
                    <Badge variant="destructive" className="text-xs">
                      Not Found
                    </Badge>
                  ) : user.from_cache ? (
                    <Badge variant="secondary" className="text-xs">
                      Cached
                    </Badge>
                  ) : (
                    <Badge className="text-xs bg-emerald-600">Live</Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo(user.cached_at)}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

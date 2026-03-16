"use client";

import { GitHubUser } from "@/lib/api";

interface Props {
  user: GitHubUser;
}

const COLORS = {
  commits: "bg-emerald-500",
  prs_merged: "bg-blue-500",
  prs_opened: "bg-violet-500",
  issues: "bg-amber-500",
};

export function ScoreBreakdownBar({ user }: Props) {
  const parts = [
    { label: "Commits", value: user.commits_30d * 3, color: COLORS.commits },
    {
      label: "PRs Merged",
      value: user.prs_merged_30d * 5,
      color: COLORS.prs_merged,
    },
    {
      label: "PRs Opened",
      value: user.prs_opened_30d * 2,
      color: COLORS.prs_opened,
    },
    { label: "Issues", value: user.issues_30d * 1, color: COLORS.issues },
  ];

  const total = parts.reduce((s, p) => s + p.value, 0);
  if (total === 0) return <div className="h-2 rounded bg-muted w-full" />;

  return (
    <div className="flex h-2 rounded overflow-hidden w-full min-w-[80px]">
      {parts.map(
        (p) =>
          p.value > 0 && (
            <div
              key={p.label}
              className={`${p.color}`}
              style={{ width: `${(p.value / total) * 100}%` }}
              title={`${p.label}: ${p.value} pts`}
            />
          )
      )}
    </div>
  );
}

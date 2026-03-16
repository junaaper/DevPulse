"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface Props {
  onSubmit: (usernames: string[]) => void;
  loading: boolean;
}

export function UsernameInput({ onSubmit, loading }: Props) {
  const [value, setValue] = useState(
    "torvalds\ngaearon\naddyosmani\nsindresorhus"
  );

  function handleSubmit() {
    const usernames = value
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (usernames.length > 0) {
      onSubmit(usernames);
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm text-muted-foreground">
        Enter GitHub usernames (one per line or comma-separated)
      </label>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="torvalds&#10;gaearon&#10;addyosmani"
        rows={4}
        className="font-mono text-sm bg-background"
      />
      <Button
        onClick={handleSubmit}
        disabled={loading || !value.trim()}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Fetching data...
          </span>
        ) : (
          "Generate Leaderboard"
        )}
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchUser } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Endpoint {
  method: string;
  path: string;
  description: string;
  body?: Record<string, unknown>;
  curl: string;
  exampleResponse: string;
}

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/v1/leaderboard",
    description:
      "Generate a leaderboard for a list of GitHub usernames. Returns users ranked by activity score descending.",
    body: { usernames: ["torvalds", "gaearon", "addyosmani"] },
    curl: `curl -X POST ${API_URL}/api/v1/leaderboard \\
  -H "Content-Type: application/json" \\
  -d '{"usernames": ["torvalds", "gaearon", "addyosmani"]}'`,
    exampleResponse: JSON.stringify(
      {
        success: true,
        data: [
          {
            username: "torvalds",
            display_name: "Linus Torvalds",
            avatar_url: "https://avatars.githubusercontent.com/u/...",
            followers: 200000,
            commits_30d: 150,
            prs_opened_30d: 5,
            prs_merged_30d: 4,
            issues_30d: 2,
            activity_score: 482,
            cached_at: "2024-01-01T00:00:00.000Z",
            from_cache: false,
          },
        ],
        meta: {
          github_rate_limit_remaining: 55,
          cached_count: 0,
          fetched_count: 1,
        },
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/v1/user/:username",
    description:
      "Get activity data for a single GitHub user. Uses cached data if available within 2 hours.",
    curl: `curl ${API_URL}/api/v1/user/torvalds`,
    exampleResponse: JSON.stringify(
      {
        success: true,
        data: {
          username: "torvalds",
          display_name: "Linus Torvalds",
          activity_score: 482,
          commits_30d: 150,
          prs_merged_30d: 4,
          prs_opened_30d: 5,
          issues_30d: 2,
          from_cache: true,
        },
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/v1/health",
    description: "Health check endpoint.",
    curl: `curl ${API_URL}/api/v1/health`,
    exampleResponse: JSON.stringify(
      {
        status: "ok",
        timestamp: "2024-01-01T00:00:00.000Z",
        rate_limit_remaining: 55,
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/v1/docs",
    description: "Returns API documentation as JSON (this page uses it).",
    curl: `curl ${API_URL}/api/v1/docs`,
    exampleResponse: '{ "name": "DevPulse API", "endpoints": [...] }',
  },
];

function MethodBadge({ method }: { method: string }) {
  const color =
    method === "POST"
      ? "bg-blue-600 text-white"
      : "bg-emerald-600 text-white";
  return (
    <span
      className={`${color} text-xs font-bold px-2 py-0.5 rounded font-mono`}
    >
      {method}
    </span>
  );
}

export function ApiDocsSection() {
  const [tryUsername, setTryUsername] = useState("torvalds");
  const [tryResult, setTryResult] = useState<string | null>(null);
  const [tryLoading, setTryLoading] = useState(false);

  async function handleTry() {
    setTryLoading(true);
    setTryResult(null);
    try {
      const res = await fetchUser(tryUsername);
      setTryResult(JSON.stringify(res, null, 2));
    } catch {
      setTryResult("Error: Could not reach the API. Is the backend running?");
    } finally {
      setTryLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          <span className="text-emerald-400">Dev</span>Pulse API
        </h1>
        <p className="text-muted-foreground">
          Query GitHub developer activity programmatically. All endpoints return
          JSON.
        </p>
        <p className="text-sm text-muted-foreground">
          Base URL:{" "}
          <code className="bg-muted px-2 py-0.5 rounded text-foreground">
            {API_URL}
          </code>
        </p>
      </div>

      {/* Try it section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Try it live</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={tryUsername}
              onChange={(e) => setTryUsername(e.target.value)}
              placeholder="GitHub username"
              className="flex-1 bg-background border border-input rounded px-3 py-2 text-sm font-mono"
            />
            <Button
              onClick={handleTry}
              disabled={tryLoading || !tryUsername.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {tryLoading ? "Loading..." : "Fetch"}
            </Button>
          </div>
          {tryResult && (
            <pre className="bg-background border border-border rounded p-4 text-xs font-mono overflow-x-auto max-h-80">
              {tryResult}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Endpoints */}
      {endpoints.map((ep) => (
        <Card key={ep.path + ep.method}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <MethodBadge method={ep.method} />
              <code className="text-sm font-mono">{ep.path}</code>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{ep.description}</p>

            {ep.body && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Request Body
                </p>
                <pre className="bg-background border border-border rounded p-3 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(ep.body, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                cURL
              </p>
              <pre className="bg-background border border-border rounded p-3 text-xs font-mono overflow-x-auto">
                {ep.curl}
              </pre>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Example Response
              </p>
              <pre className="bg-background border border-border rounded p-3 text-xs font-mono overflow-x-auto max-h-64">
                {ep.exampleResponse}
              </pre>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

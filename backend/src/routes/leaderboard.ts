import { Router, Request, Response } from "express";
import { fetchGitHubUser, getRateLimitRemaining } from "../services/github";
import { getCached, getCachedStale, upsertCache } from "../services/cache";
import { ApiResponse, GitHubUser } from "../types";

const router = Router();

async function resolveUser(username: string): Promise<GitHubUser> {
  const normalized = username.toLowerCase().trim();

  // Check fresh cache first
  const cached = await getCached(normalized);
  if (cached) return cached;

  // Fetch from GitHub
  try {
    const fresh = await fetchGitHubUser(normalized);
    await upsertCache(fresh);
    return fresh;
  } catch (err: any) {
    if (err.message === "RATE_LIMITED") {
      // Fall back to stale cache
      const stale = await getCachedStale(normalized);
      if (stale) return stale;
      throw new Error(
        "GitHub rate limit exceeded and no cached data available"
      );
    }
    if (err.message === "NOT_FOUND") {
      return {
        username: normalized,
        display_name: null,
        avatar_url: null,
        followers: 0,
        commits_30d: 0,
        prs_opened_30d: 0,
        prs_merged_30d: 0,
        issues_30d: 0,
        activity_score: 0,
        cached_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        not_found: true,
        from_cache: false,
      };
    }
    throw err;
  }
}

// POST /api/v1/leaderboard
router.post("/leaderboard", async (req: Request, res: Response) => {
  try {
    const { usernames } = req.body;

    if (!Array.isArray(usernames) || usernames.length === 0) {
      res.status(400).json({
        success: false,
        data: null,
        error: "Request body must include a non-empty 'usernames' array",
      });
      return;
    }

    if (usernames.length > 25) {
      res.status(400).json({
        success: false,
        data: null,
        error: "Maximum 25 usernames per request",
      });
      return;
    }

    const unique = [...new Set(usernames.map((u: string) => u.toLowerCase().trim()))];

    // Process users sequentially to avoid GitHub's secondary rate limit
    const results: GitHubUser[] = [];
    for (const u of unique) {
      try {
        results.push(await resolveUser(u));
      } catch (err: any) {
        // Don't let one user's error crash the whole request
        results.push({
          username: u,
          display_name: null,
          avatar_url: null,
          followers: 0,
          commits_30d: 0,
          prs_opened_30d: 0,
          prs_merged_30d: 0,
          issues_30d: 0,
          activity_score: 0,
          cached_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          not_found: true,
          from_cache: false,
        });
        console.warn(`Failed to resolve ${u}: ${err.message}`);
      }
    }

    const cachedCount = results.filter((r) => r.from_cache).length;
    const ranked = results.sort((a, b) => b.activity_score - a.activity_score);

    const response: ApiResponse<GitHubUser[]> = {
      success: true,
      data: ranked,
      meta: {
        github_rate_limit_remaining: getRateLimitRemaining() ?? undefined,
        cached_count: cachedCount,
        fetched_count: results.length - cachedCount,
      },
    };

    res.json(response);
  } catch (err: any) {
    console.error("Leaderboard error:", err.message);
    res.status(500).json({
      success: false,
      data: null,
      error: err.message || "Internal server error",
    });
  }
});

// GET /api/v1/user/:username
router.get("/user/:username", async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req.params.username);
    const response: ApiResponse<GitHubUser> = {
      success: true,
      data: user,
      meta: {
        github_rate_limit_remaining: getRateLimitRemaining() ?? undefined,
      },
    };
    res.json(response);
  } catch (err: any) {
    console.error("User fetch error:", err.message);
    res.status(500).json({
      success: false,
      data: null,
      error: err.message || "Internal server error",
    });
  }
});

// GET /api/v1/health
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    rate_limit_remaining: getRateLimitRemaining(),
  });
});

// GET /api/v1/docs
router.get("/docs", (_req: Request, res: Response) => {
  res.json({
    name: "DevPulse API",
    version: "1.0.0",
    description: "GitHub Activity Leaderboard API",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/leaderboard",
        description:
          "Generate a leaderboard for a list of GitHub usernames. Returns users ranked by activity score.",
        body: {
          usernames: ["torvalds", "gaearon", "addyosmani"],
        },
        example_response: {
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
              cached_at: "2024-01-01T00:00:00Z",
              from_cache: false,
            },
          ],
          meta: {
            github_rate_limit_remaining: 55,
            cached_count: 0,
            fetched_count: 1,
          },
        },
      },
      {
        method: "GET",
        path: "/api/v1/user/:username",
        description:
          "Get activity data for a single GitHub user. Uses cached data if available within 2 hours.",
        example_response: {
          success: true,
          data: {
            username: "torvalds",
            display_name: "Linus Torvalds",
            avatar_url: "https://avatars.githubusercontent.com/u/...",
            followers: 200000,
            commits_30d: 150,
            prs_opened_30d: 5,
            prs_merged_30d: 4,
            issues_30d: 2,
            activity_score: 482,
            cached_at: "2024-01-01T00:00:00Z",
            from_cache: true,
          },
        },
      },
      {
        method: "GET",
        path: "/api/v1/health",
        description: "Health check endpoint",
        example_response: {
          status: "ok",
          timestamp: "2024-01-01T00:00:00Z",
          rate_limit_remaining: 55,
        },
      },
      {
        method: "GET",
        path: "/api/v1/docs",
        description: "This endpoint — returns API documentation as JSON",
      },
    ],
  });
});

export default router;

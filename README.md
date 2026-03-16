# DevPulse — GitHub Activity Leaderboard

A full-stack web app that ranks GitHub developers by their contribution activity over the last 30 days. Enter a list of usernames and get a scored, ranked leaderboard with commits, PRs, issues, and a weighted activity score.

**Live Demo:** _[your-vercel-url.vercel.app]_ (placeholder)

---

## Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│                 │       │                  │       │                  │
│   Next.js 14    │──────▶│  Express API     │──────▶│  GitHub REST     │
│   (Vercel)      │  HTTP │  (Render)        │  HTTP │  API v3          │
│                 │       │                  │       │                  │
└─────────────────┘       └────────┬─────────┘       └──────────────────┘
                                   │
                                   │ SQL
                                   ▼
                          ┌──────────────────┐
                          │                  │
                          │   Supabase       │
                          │   (PostgreSQL)   │
                          │   Cache Layer    │
                          │                  │
                          └──────────────────┘
```

**Flow:**
1. User enters GitHub usernames on the frontend
2. Frontend POSTs to the Express backend
3. Backend checks Supabase cache (2-hour TTL)
4. Cache miss → fetches from GitHub Search API
5. Results cached in Supabase, returned ranked by activity score

---

## API Documentation

Base URL: `https://your-render-url.onrender.com`

### POST /api/v1/leaderboard

Generate a ranked leaderboard for multiple GitHub users.

```bash
curl -X POST https://your-api.onrender.com/api/v1/leaderboard \
  -H "Content-Type: application/json" \
  -d '{"usernames": ["torvalds", "gaearon", "addyosmani"]}'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "username": "torvalds",
      "display_name": "Linus Torvalds",
      "avatar_url": "https://avatars.githubusercontent.com/u/...",
      "followers": 200000,
      "commits_30d": 150,
      "prs_opened_30d": 5,
      "prs_merged_30d": 4,
      "issues_30d": 2,
      "activity_score": 482,
      "cached_at": "2024-01-01T00:00:00.000Z",
      "from_cache": false
    }
  ],
  "meta": {
    "github_rate_limit_remaining": 55,
    "cached_count": 0,
    "fetched_count": 3
  }
}
```

### GET /api/v1/user/:username

Get activity data for a single user.

```bash
curl https://your-api.onrender.com/api/v1/user/torvalds
```

### GET /api/v1/health

```bash
curl https://your-api.onrender.com/api/v1/health
```

### GET /api/v1/docs

Returns machine-readable JSON describing all endpoints.

---

## Activity Score Formula

```
score = (commits × 3) + (prs_merged × 5) + (prs_opened × 2) + (issues × 1)
```

---

## Design Decisions

### Why caching?
GitHub's unauthenticated rate limit is **60 requests/hour**. Each user lookup requires ~5 API calls (profile + 4 search queries). Without caching, a single 12-user leaderboard would exhaust the hourly limit. Supabase caching lets us serve repeat lookups instantly.

### Why a 2-hour TTL?
Balances data freshness with API quota conservation. Developer activity doesn't change minute-to-minute, so 2 hours is a reasonable window. On rate-limit errors, the backend falls back to stale cached data rather than failing.

### Why is it slow for uncached users?
GitHub's Search API enforces a **secondary rate limit** (~30 requests/minute) that throttles concurrent requests. Each user needs 4 search queries, so the backend runs them sequentially with 1.5-second delays to avoid getting blocked. This means each uncached user takes **~6 seconds** to fetch. Here's what that looks like in practice:

| Scenario | Speed |
|----------|-------|
| All users cached (within 2 hours) | Instant |
| 5 uncached users | ~30 seconds |
| 15 uncached users | ~1.5 minutes |
| 25 uncached users (max per request) | ~2.5 minutes |

The second time you look up the same users, results come from cache and load instantly. A `GITHUB_TOKEN` env var raises the REST API limit from 60 to 5,000 req/hour but does **not** remove the search rate limit — the delays are still necessary.

### Why this score formula?
Weighted to reward meaningful contributions:
- **Merged PRs (×5)** — highest signal of accepted, meaningful work
- **Commits (×3)** — direct code contributions
- **Opened PRs (×2)** — shows initiative, even if not yet merged
- **Issues (×1)** — participation, but lower weight since it's not code

---

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)

### 1. Set up Supabase

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE github_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  followers INT DEFAULT 0,
  commits_30d INT DEFAULT 0,
  prs_opened_30d INT DEFAULT 0,
  prs_merged_30d INT DEFAULT 0,
  issues_30d INT DEFAULT 0,
  activity_score INT DEFAULT 0,
  cached_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_username ON github_cache(username);
CREATE INDEX idx_activity_score ON github_cache(activity_score DESC);
CREATE INDEX idx_cached_at ON github_cache(cached_at);
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and optional GitHub token
npm install
npm run dev
```

The API runs at `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local if your backend is not at localhost:3001
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

---

## Deployment

### Backend → Render.com

1. Push the repo to GitHub
2. Create a new Web Service on Render, point it to the `backend/` directory
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables in Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GITHUB_TOKEN` (optional)
   - `CORS_ORIGIN` (your Vercel frontend URL)
   - `NODE_ENV=production`

A `render.yaml` is included in the backend folder.

### Frontend → Vercel

1. Import the repo on Vercel, set root directory to `frontend/`
2. Add environment variable: `NEXT_PUBLIC_API_URL` = your Render backend URL
3. Deploy — zero config needed for Next.js

### Database → Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the SQL above in the SQL Editor
3. Copy the URL and anon key from Settings → API

---

## Tech Stack

| Layer     | Technology                      |
|-----------|---------------------------------|
| Frontend  | Next.js 14, Tailwind, shadcn/ui |
| Backend   | Node.js, Express, TypeScript    |
| Database  | Supabase (PostgreSQL)           |
| Data      | GitHub REST API v3              |
| Deploy    | Vercel + Render + Supabase      |

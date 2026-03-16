# DevPulse

A GitHub activity leaderboard. Paste in a list of GitHub usernames and see who's been the most active over the last 30 days — ranked by commits, PRs, issues, and a weighted activity score.

**Live:** [dev-pulse-alpha.vercel.app](https://dev-pulse-alpha.vercel.app)

> **Heads up:** The backend runs on Render's free tier, which spins down after 15 minutes of inactivity. The first request after idle takes 30-60 seconds to cold start. After that, things are snappy. Uncached users take ~6 seconds each due to GitHub Search API rate limits (explained below).

---

## How it works

The frontend sends a list of usernames to the Express backend. For each user, the backend checks a Supabase cache first — if the data is less than 2 hours old, it returns it immediately. Otherwise, it hits the GitHub API (profile info + search queries for commits, PRs, and issues from the last 30 days), calculates an activity score, caches the result, and returns everything ranked.

The frontend → backend → GitHub API pipeline is straightforward. Supabase sits in the middle as a cache layer so repeat lookups don't burn through GitHub's rate limits.

---

## Activity score

```
score = (commits × 3) + (prs_merged × 5) + (prs_opened × 2) + (issues × 1)
```

Merged PRs are weighted highest because they represent accepted, reviewed work. Commits are next. Issues get the lowest weight since they don't involve code.

---

## API

The backend exposes a public REST API. Full docs are at [/docs](https://dev-pulse-alpha.vercel.app/docs) on the site, but here's the short version:

**POST /api/v1/leaderboard** — generate a ranked leaderboard

```bash
curl -X POST https://devpulse-api-001d.onrender.com/api/v1/leaderboard \
  -H "Content-Type: application/json" \
  -d '{"usernames": ["torvalds", "gaearon", "addyosmani"]}'
```

**GET /api/v1/user/:username** — single user lookup

```bash
curl https://devpulse-api-001d.onrender.com/api/v1/user/torvalds
```

**GET /api/v1/health** — health check

**GET /api/v1/docs** — full endpoint docs as JSON

---

## Rate limits and speed

Each uncached user needs 5 GitHub API calls (1 profile + 4 search queries). GitHub's Search API has a secondary rate limit that punishes concurrent requests, so the backend spaces them out with 1.5-second delays. In practice:

- **Cached users** — instant
- **5 uncached users** — ~30 seconds
- **25 uncached users** (max per request) — ~2.5 minutes

The second time you look up the same users it's instant from cache. Adding a `GITHUB_TOKEN` raises the REST limit from 60 to 5,000 req/hour but doesn't remove the search throttle.

---

## Running locally

You'll need Node.js 18+ and a Supabase project.

**Database setup** — run this in the Supabase SQL Editor:

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

**Backend:**

```bash
cd backend
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_ANON_KEY, and optionally GITHUB_TOKEN
npm install
npm run dev
```

Runs at `http://localhost:3001`.

**Frontend:**

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Runs at `http://localhost:3000`.

---

## Deployment

- **Backend** → Render.com (free tier). Set root directory to `backend/`, build command `npm install && npm run build`, start command `npm start`. Add env vars for Supabase credentials, CORS origin, and optionally a GitHub token.
- **Frontend** → Vercel. Set root directory to `frontend/`, add `NEXT_PUBLIC_API_URL` pointing to your Render URL.
- **Database** → Supabase (free tier). Run the SQL above, grab the URL and anon key from project settings.

See [deployment.md](deployment.md) for a detailed step-by-step guide.

---

## Tech stack

- **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** Supabase (PostgreSQL)
- **Data source:** GitHub REST API v3
- **Hosting:** Vercel + Render

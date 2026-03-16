# DevPulse Deployment Guide

Step-by-step instructions to deploy DevPulse to production using **Render** (backend), **Vercel** (frontend), and your existing **Supabase** project.

---

## Prerequisites

- A GitHub account with this repo pushed to a repository
- Your Supabase project is already set up with the `github_cache` table
- A [Render](https://render.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- (Optional) A GitHub personal access token for higher rate limits

---

## Step 1: Push your code to GitHub

If you haven't already:

```bash
cd devpulse
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/devpulse.git
git push -u origin main
```

---

## Step 2: Get your Supabase credentials

You'll need two values from your existing Supabase project:

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. In the left sidebar, click **Project Settings** (the gear icon at the bottom)
4. Click **API** under the "Configuration" section
5. Copy these two values — you'll need them for Render:
   - **Project URL** — looks like `https://abcdefghij.supabase.co`
   - **anon public** key — the long key under "Project API keys"

Keep this tab open; you'll paste these into Render in the next step.

---

## Step 3: Deploy the backend to Render

### 3.1 — Create a new Web Service

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub account if you haven't already
4. Find and select your **devpulse** repository
5. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `devpulse-api` |
| **Region** | Pick the one closest to you |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 3.2 — Add environment variables

Scroll down to the **Environment Variables** section and add these one by one:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://abcdefghij.supabase.co`) |
| `SUPABASE_ANON_KEY` | Your Supabase anon public key |
| `GITHUB_TOKEN` | *(Optional)* A GitHub personal access token — see Step 3.3 |
| `CORS_ORIGIN` | Leave blank for now — you'll come back and set this after Vercel deploy |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

### 3.3 — (Optional but recommended) Create a GitHub token

Without a token, GitHub limits you to 60 API requests/hour. With one, you get 5,000/hour.

1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token** → **Generate new token (classic)**
3. Give it a name like `devpulse`
4. You do **not** need to check any permission scopes — public data access requires no scopes
5. Click **Generate token**
6. Copy the token and paste it as the `GITHUB_TOKEN` value in Render

### 3.4 — Deploy

1. Click **Create Web Service**
2. Render will start building your backend — this takes 2-3 minutes
3. Once the deploy is complete, you'll see a green **Live** badge
4. Your backend URL will be shown at the top, something like:
   ```
   https://devpulse-api.onrender.com
   ```
5. **Copy this URL** — you'll need it for the frontend and for updating CORS

### 3.5 — Verify the backend is running

Open your browser and go to:

```
https://devpulse-api.onrender.com/api/v1/health
```

You should see:

```json
{
  "status": "ok",
  "timestamp": "2026-03-16T...",
  "rate_limit_remaining": null
}
```

> **Note:** Free tier Render services spin down after 15 minutes of inactivity. The first request after idle may take 30-60 seconds to cold start. This is normal.

---

## Step 4: Deploy the frontend to Vercel

### 4.1 — Import the project

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Connect your GitHub account if you haven't already
3. Find and select your **devpulse** repository
4. Configure the project:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Next.js` (should auto-detect) |
| **Root Directory** | Click **Edit** → type `frontend` → click **Continue** |

### 4.2 — Add environment variables

Expand the **Environment Variables** section and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL from Step 3.4 (e.g. `https://devpulse-api.onrender.com`) |

> **Important:** Do NOT include a trailing slash. Use `https://devpulse-api.onrender.com` not `https://devpulse-api.onrender.com/`

### 4.3 — Deploy

1. Click **Deploy**
2. Vercel will build and deploy your frontend — this takes 1-2 minutes
3. Once complete, Vercel gives you a production URL like:
   ```
   https://devpulse-yourname.vercel.app
   ```
4. **Copy this URL** — you need it for the next step

---

## Step 5: Update CORS on Render

Now that you have your Vercel frontend URL, go back to Render and update the CORS setting so the backend accepts requests from your frontend.

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click on your **devpulse-api** service
3. In the left sidebar, click **Environment**
4. Find the `CORS_ORIGIN` variable
5. Set its value to your Vercel frontend URL (e.g. `https://devpulse-yourname.vercel.app`)
6. Click **Save Changes**
7. Render will automatically redeploy with the updated variable — wait for the deploy to finish

---

## Step 6: Verify everything works end-to-end

1. Open your Vercel frontend URL in a browser
2. You should see the DevPulse leaderboard page
3. The default usernames are pre-filled — click **Generate Leaderboard**
4. Wait for results (first request may be slow due to Render cold start)
5. You should see a ranked table with avatars, scores, and cached/live badges
6. Click **API Docs** in the nav bar — verify the docs page loads and the "Try it live" section works
7. Run the same leaderboard again — the second time should show "Cached" badges

---

## Troubleshooting

### "Could not reach the API" error on the frontend

- **Check CORS:** Make sure `CORS_ORIGIN` on Render matches your exact Vercel URL (no trailing slash)
- **Check the API URL:** Make sure `NEXT_PUBLIC_API_URL` on Vercel has no trailing slash and starts with `https://`
- **Cold start:** Free Render services sleep after inactivity. Wait 30-60 seconds and try again
- **Redeploy frontend:** If you changed `NEXT_PUBLIC_API_URL` after the initial deploy, you must redeploy on Vercel because `NEXT_PUBLIC_` vars are baked in at build time. Go to Vercel → Deployments → click the three dots on the latest → **Redeploy**

### GitHub rate limit errors

- Check your backend logs on Render (Dashboard → your service → **Logs**)
- If you see 403/429 from GitHub, add a `GITHUB_TOKEN` env var on Render
- The API will fall back to cached data when rate-limited, but fresh lookups will fail

### Supabase connection errors

- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct on Render
- Make sure your Supabase project is not paused (free tier projects pause after 1 week of inactivity — go to the Supabase dashboard and resume it)
- Check that the `github_cache` table exists by going to Supabase → Table Editor

### API works in browser but not from frontend

This is almost always a CORS issue. Double-check:
1. `CORS_ORIGIN` on Render is set to your exact Vercel URL
2. The Render service has redeployed after you changed it
3. No trailing slash on the URL

---

## Custom domain (optional)

### Vercel
1. Go to your project on Vercel → **Settings** → **Domains**
2. Add your custom domain and follow the DNS instructions
3. Update `CORS_ORIGIN` on Render to match your new domain

### Render
1. Go to your service on Render → **Settings** → **Custom Domains**
2. Add your custom domain and follow the DNS instructions
3. Update `NEXT_PUBLIC_API_URL` on Vercel to match your new backend domain
4. Redeploy the frontend on Vercel

# Backend deployment (Render)

Deploy the API on [Render](https://render.com) **before** the UI, so you have an API URL to give Vercel.

Repo: [https://github.com/Surbhi-jain/period-tracker](https://github.com/Surbhi-jain/period-tracker)

Use the **whole git repo**. Set the service root directory to `backend`. That keeps `shared/` available (`file:../shared`).

- Build: `npm ci`
- Start: `npm start`
- Port: Render sets `PORT` (the app already reads it)

Do not deploy the website on Render. Do not add a Render Postgres — Luna uses Supabase.

Free instance sleeps after about 15 minutes with no traffic. The next request can take about a minute to wake. That is expected.

## Before you start

1. The schema in Supabase matches `supabase/schema.sql` (email as the identity, no `profiles` table).
2. You have a Google OAuth client (the same one as local).
3. You have a **new** production `AUTH_SECRET` (`npx auth secret`). Do not reuse the local one.
4. You will set `FRONTEND_URL` after the UI is live. You can deploy first with a temporary value, then update it.

## Environment variables

Set these only on Render. See `backend/.env.example`.

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | Output of `npx auth secret` |
| `AUTH_GOOGLE_ID` | Google Cloud OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google Cloud OAuth client secret |
| `API_URL` | This API’s public HTTPS origin, for example `https://luna-api.onrender.com` |
| `FRONTEND_URL` | The website origin, for example `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` |
| `PORT` | Leave unset. Render provides it. |

Never put `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, or `AUTH_GOOGLE_SECRET` on the UI host.

## Steps

1. Open [Render](https://render.com) and sign in with GitHub.
2. Dashboard → **New** → **Web Service**.
3. Connect `Surbhi-jain/period-tracker` (or your fork).
4. Fill in:
   - **Name:** `luna-api` (or any name)
   - **Language:** Node
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Instance type:** **Free**
5. **Environment Variables** → add every name in the table except `PORT`.
   - `API_URL` can be a placeholder (`https://luna-api.onrender.com`) until you have the real URL.
   - `FRONTEND_URL` can be `http://localhost:3000` until Vercel is live.
6. Create Web Service. Wait until the first deploy finishes.
7. Copy the public URL (`https://<name>.onrender.com`). Set `API_URL` to that origin (no trailing slash) and **Manual Deploy** → **Deploy latest commit** if the first value was a guess.
8. Open `https://<name>.onrender.com/health`. You should see `{ "ok": true }`. A cold start can take about a minute.

## Google redirect (API side)

In Google Cloud Console → APIs & Services → Credentials → your OAuth client, add:

`https://<name>.onrender.com/auth/google/callback`

Keep `http://localhost:4000/auth/google/callback` for local work.

## After the UI is live

1. Set `FRONTEND_URL` on Render to the Vercel origin (no trailing slash).
2. Manual Deploy → Deploy latest commit (or wait for the next auto deploy) so CORS and the sign-in return URL update.
3. Follow [UI deployment](ui-deployment.md) if you have not deployed the website yet.
4. On Vercel, `NEXT_PUBLIC_API_URL` must be `https://<name>.onrender.com`.

## Check

- `GET /health` returns `{ "ok": true }` over HTTPS
- `GET /periods` without a token returns `401` and `{ "error": "Sign in required." }`
- After the UI is connected, Google sign-in returns to the tracker and a saved period survives a refresh

# UI deployment

Deploy the website on its own host (Vercel). Deploy the **backend first**, then come here with that API URL.

Repo: [https://github.com/Surbhi-jain/period-tracker](https://github.com/Surbhi-jain/period-tracker)

- Framework: Next.js
- Root directory: `ui`
- `shared/` must stay in the repo (`file:../shared`)

Do not put backend secrets on this host.

## Before you start

1. The API is live and `https://<your-api-host>/health` returns `{ "ok": true }`.
2. You know the API origin, for example `https://luna-api.onrender.com` (no trailing slash).
3. Steps for the API: [Backend deployment](backend-deployment.md).

## Environment variables

Set these only on the UI host. See `ui/.env.example`.

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | This website’s public HTTPS origin, for example `https://your-app.vercel.app` |
| `NEXT_PUBLIC_API_URL` | The API origin from the backend host |

Do **not** set `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, or `AUTH_GOOGLE_SECRET` here.

## Vercel

1. Open [Vercel](https://vercel.com) and sign in with GitHub.
2. Add New → Project → import `Surbhi-jain/period-tracker`.
3. Root Directory: `ui` (Edit → `ui`). Leave “Include files outside the root directory” on so `shared/` installs.
4. Framework Preset: Next.js. Leave the build as `next build`.
5. Environment Variables (Production):
   - `NEXT_PUBLIC_SITE_URL` — after the first deploy you can set this to the `*.vercel.app` URL, then redeploy
   - `NEXT_PUBLIC_API_URL` — the live API origin
6. Deploy.
7. Copy the website URL. Set `NEXT_PUBLIC_SITE_URL` to that origin (no trailing slash) and Redeploy if it was a placeholder.
8. On the **API host**, set `FRONTEND_URL` to the same website origin and restart the backend.

## Google (website side)

In Google Cloud Console → APIs & Services → Credentials → your OAuth client, add:

Authorised JavaScript origins:

- `http://localhost:3000`
- `https://<your-website>`

Authorised redirect URIs stay on the **API** host:

- `http://localhost:4000/auth/google/callback`
- `https://<your-api-host>/auth/google/callback`

Keep the localhost entries so `npm run dev` still signs in.

## Custom domain

1. Vercel → the project → Domains → add `app.example.com`.
2. Change `NEXT_PUBLIC_SITE_URL` to `https://app.example.com` and redeploy.
3. On the API host, change `FRONTEND_URL` to `https://app.example.com` and restart.
4. Add `https://app.example.com` as an authorised JavaScript origin in Google Cloud.

A new domain does not move guest logs. Those stay in each browser.

## Check

- Homepage and journal load over HTTPS
- A guest can log a period in that browser
- Google sign-in returns to `/tracker`
- A signed-in save is still there after a refresh
- Download and delete still work

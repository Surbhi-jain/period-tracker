# Host these two applications separately

Luna is two hosts, plus Supabase. Do not put both apps on one static site.

| Host | What you deploy | Suggested service |
| --- | --- | --- |
| **Website** | `ui/` | Vercel. Project root directory: `ui` |
| **API** | `backend/` (needs `shared/` next to it) | Railway, Render, or Fly |
| **Data** | Existing Supabase project | Leave it where it is |

A later mobile app uses the API host only.

The website must be HTTPS. Production sends HSTS and a content-security policy from `ui/next.config.ts`.

## How the two hosts talk

```
Browser  →  https://your-app.vercel.app     (UI)
         →  https://your-api.example.com    (backend)
Backend  →  Supabase
```

After you have both URLs, they must point at each other:

| Variable | Set on | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | UI | Website origin |
| `NEXT_PUBLIC_API_URL` | UI | API origin |
| `FRONTEND_URL` | Backend | Website origin |
| `API_URL` | Backend | API origin |

Example: website `https://luna.vercel.app`, API `https://luna-api.up.railway.app`.

Do not put `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, or `AUTH_GOOGLE_SECRET` on the UI host.

## 1. Deploy the backend first

Use the **whole git repo**, with the service’s root directory set to `backend`. That way `file:../shared` still installs.

- Build: `npm ci`
- Start: `npm start`
- Port: use the host’s `PORT` (the app already reads it)

Set these on the API host:

| Name | Notes |
| --- | --- |
| `AUTH_SECRET` | New secret (`npx auth secret`), not the local one |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Same Google OAuth client as local |
| `API_URL` | This API’s public HTTPS origin |
| `FRONTEND_URL` | The website origin (CORS and post-sign-in return) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only |
| `PORT` | Usually set by the host |

Confirm `https://<your-api-host>/health` returns `{ "ok": true }`.

## 2. Deploy the UI

In Vercel, import the same repo. **Root Directory: `ui`.**

Set these on the UI host:

| Name | Notes |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | This website’s public HTTPS origin |
| `NEXT_PUBLIC_API_URL` | The API origin from step 1 |

No Supabase keys and no Google secret on Vercel.

## 3. Google Cloud

Same OAuth client as local. Add:

Authorised JavaScript origins:

- `http://localhost:3000`
- `https://<your-website>`

Authorised redirect URIs:

- `http://localhost:4000/auth/google/callback`
- `https://<your-api-host>/auth/google/callback`

Keep the localhost URIs so local sign-in still works.

## 4. Check the live site

- Homepage and journal load over HTTPS
- A guest can log a period in that browser
- Google sign-in returns to the tracker
- A signed-in save is still there after a refresh
- Download and delete still work

## Custom domains

Website on Vercel, API on the backend host (for example `app.example.com` and `api.example.com`). Then update all four URL variables and the Google redirect.

A new domain does not move guest logs. Those stay in each browser. Only Google-signed-in periods are in Supabase.

## Database

Use the same Supabase project unless you intentionally create a production one.

Schema must match `supabase/schema.sql` (email as the identity, no `profiles` table). Older projects: run the migrations listed in the README first.

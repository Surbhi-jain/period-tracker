# Luna backend

Standalone API for signed-in period data. Sibling of the [`ui`](../ui) website. A future mobile app should call this service, not the UI.

Guest tracking stays in the browser. This API is only used after Google sign-in.

## Run

From this folder:

```bash
npm ci
cp .env.example .env   # or keep values in the repo-root .env.local
npm run dev
```

The API listens on http://localhost:4000.

## Endpoints

All period and account routes need a session.

| Method | Path | Who |
| --- | --- | --- |
| GET | `/health` | Anyone |
| GET | `/auth/google?next=/tracker` | Website redirect sign-in |
| GET | `/auth/google/callback` | Google redirect |
| POST | `/auth/google` | Mobile: `{ "idToken": "..." }` → `{ token, user }` |
| GET | `/auth/me` | `{ user }` |
| POST | `/auth/sign-out` | Clears the session cookie |
| GET | `/periods` | `{ periods }` |
| POST | `/periods` | `{ startDate, endDate }` → `{ period }` |
| PUT | `/periods/:id` | `{ startDate, endDate }` → `{ period }` |
| DELETE | `/periods/:id` | `{ ok: true }` |
| GET | `/account` | Download: `{ exportedAt, account, periods }` |
| DELETE | `/account` | Deletes every period for that email |
| GET | `/profile` | Always `{ profile: null }` |
| PUT | `/profile` | 410 — Luna does not collect age |

Send the JWT as `Authorization: Bearer <token>` (mobile) or rely on the `luna_session` cookie (website).

Dates are `YYYY-MM-DD`. Identity is the Google email, lower-cased.

## Google

Authorised redirect URI:

`http://localhost:4000/auth/google/callback`

Production: `https://<your-api-host>/auth/google/callback`

A mobile app uses Google Sign-In, then `POST /auth/google` with the ID token. It does not use the redirect.

## Host separately

Deploy this folder on its own host (Railway, Render, or Fly). Use the whole git repo with the service root set to `backend`, so `shared/` still installs. Do not put the website on the same host. Steps: [docs/hosting.md](../docs/hosting.md).

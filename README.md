# Luna — private period tracker

Luna helps people log their periods and see what is coming: the next period, the fertile window, estimated ovulation and PMS days, all on one monthly calendar.

- **No account needed.** Signed-out data stays in the browser (`localStorage`).
- **Optional Google sign-in** saves data to Supabase so it follows you between devices. Device data moves into the account on first sign-in.
- **Your data, your call.** Download everything as JSON or delete it all from the tracker.
- Dates are estimates, not a diagnosis, and must not be used as contraception.

## Applications

| Application | Folder | Role |
| --- | --- | --- |
| UI | [`ui/`](ui/README.md) | Next.js website |
| Backend | [`backend/`](backend/README.md) | Auth and saved periods |
| Shared | [`shared/`](shared/) | Date and period rules used by both |

A future mobile app should call the backend. Guest tracking stays in the UI.

## How it is built

| Part | Where |
| --- | --- |
| Pages (landing, `/tracker`, `/privacy`) | `ui/src/app` |
| Tracker UI | `ui/src/components/tracker`, `ui/src/hooks/use-tracker.ts` |
| Browser or account storage | `ui/src/lib/tracker-store.ts` |
| Cycle maths and calendar | `ui/src/lib/cycle-estimate.ts`, `ui/src/lib/calendar.ts` |
| Backend API | `backend/src` |
| Input rules | `shared/validation.ts` |

Identity is the signed-in Google email (lower-cased). Only the backend talks to Supabase, using the `service_role` key. Row-level security stays on with no public policies.

## Set up

1. Install the UI: `npm ci --prefix ui`
2. Install the backend: `npm ci --prefix backend`
3. Copy `.env.example` to `.env.local` at the **repo root** and fill it in. Never commit real keys.
4. In Supabase → SQL Editor, run:
   - a **new project**: `supabase/schema.sql`
   - an **existing project** made before 2 Oct 2026: `supabase/migrations/20261002_email_primary_key.sql`
   - an **existing project** that still has a `profiles` table: `supabase/migrations/20261004_drop_age_profiles.sql`
5. In Google Cloud, add `http://localhost:4000/auth/google/callback` as an authorised redirect URI. Live URLs: [docs/hosting.md](docs/hosting.md).
6. Start the backend: `npm run dev:api`
7. Start the UI: `npm run dev` and open http://localhost:3000. Stop each with **Ctrl+C** (not Ctrl+Z, which leaves the port busy).

## Scripts

From the repo root:

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm run dev:ui` | UI development server (port 3000) |
| `npm run dev:api` | Backend development server (port 4000) |
| `npm run build` / `npm start` | UI production build and server |
| `npm run test:run` | UI and backend unit tests |
| `npm run check` | Lint, type check, and all tests |

## Deploying

Host the two applications on **two hosts**: UI on Vercel (root directory `ui`), backend on Railway, Render, or Fly. They only share Supabase and the four public URL variables. Full steps: [docs/hosting.md](docs/hosting.md). Backend endpoints: [backend/README.md](backend/README.md).

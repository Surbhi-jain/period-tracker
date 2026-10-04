# Luna UI

Next.js website. Guest periods stay in the browser. Signed-in data is loaded from the backend.

## Run

From the repo root:

```bash
npm run dev:ui
```

Or from this folder: `npm run dev`. Open http://localhost:3000.

The backend must also be running (`npm run dev:api`) for Google sign-in and saved periods.

Local env vars come from the repo-root `.env.local`. Production env vars are set only on the UI host — see [docs/hosting.md](../docs/hosting.md).

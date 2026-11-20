# Mirabel - School ID System

A school identification and access management system with QR-code check-in, digital ID cards and an admin dashboard.

## Features

- **QR code ID cards** for staff and visitors, with photo
- **Camera check-in desk** (public page): scan or type an ID to verify and log entry
- **Visitor date control**: visitors can only check in on their expected date
- **Revoke / re-activate IDs**
- **Admin dashboard** with check-in charts and access logs (password protected)

## Tech stack

React 19 · Vite · Tailwind CSS 4 · Express 5 · MongoDB (Mongoose) — **one app, one deployment.**

```
mirabel/
├── api/index.js          # Vercel serverless entry (wraps server/app.js)
├── server/
│   ├── app.js            # Express API (all /api routes)
│   ├── index.js          # Standalone server: API + built frontend in one process
│   ├── auth.js           # Admin login (signed httpOnly cookie)
│   ├── config.js         # Env var loading/validation
│   ├── db.js             # Cached MongoDB connection
│   ├── models/           # Person, Log
│   ├── routes/           # people, logs
│   └── scripts/          # one-off maintenance scripts
├── src/                  # React frontend
├── vercel.json
└── package.json          # single package for frontend + backend
```

## Environment variables

Copy `.env.example` to `.env` (project root) for local development. In production, set them in your host's dashboard.

| Variable            | Required | Description                                                       |
| ------------------- | -------- | ----------------------------------------------------------------- |
| `MONGO_URI`         | yes      | MongoDB connection string (e.g. MongoDB Atlas)                    |
| `ADMIN_PASSWORD`    | yes      | Password for the admin pages                                      |
| `SESSION_SECRET`    | yes      | 32+ random characters used to sign admin sessions                 |
| `APP_TIMEZONE`      | no       | School timezone (IANA name). Default `Africa/Lagos`               |
| `SESSION_TTL_HOURS` | no       | Admin session length. Default `12`                                |
| `PORT`              | no       | Port for the standalone server. Default `5000` (ignored on Vercel) |

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Local development

Requires Node.js 20.12+.

```bash
npm install
cp .env.example .env      # then fill in the values

npm run dev:server        # API on http://localhost:5000 (auto-restarts)
npm run dev               # frontend on http://localhost:5173 (proxies /api)
```

Run a production build locally (single process, same as production):

```bash
npm run build
npm start                 # http://localhost:5000 serves both the app and the API
```

## Deployment (single deployment)

### Option A: Vercel (recommended)

The frontend and the API deploy together as **one Vercel project**: static files from `dist/`, and `/api/*` handled by the serverless function in `api/index.js`.

1. Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new). Leave the root directory as the repo root; build settings come from `vercel.json`.
2. Under **Settings → Environment Variables**, add `MONGO_URI`, `ADMIN_PASSWORD`, `SESSION_SECRET` (and optionally `APP_TIMEZONE`).
3. In MongoDB Atlas → **Network Access**, allow `0.0.0.0/0`. Vercel has no fixed outbound IPs.
4. Deploy. Check `https://<your-app>.vercel.app/api/health`.

### Option B: Any Node host (Render, Railway, Fly.io, VPS, ...)

One web service:

- **Build command:** `npm ci && npm run build`
- **Start command:** `npm start`
- **Env vars:** as above (plus `NODE_ENV=production`)
- **Health check path:** `/api/health`

## Migrating photos from the old disk storage

Photos used to be saved to `server/uploads/`. They are now stored in MongoDB so the app runs on serverless hosts. To copy existing photos into the database (run once, with `.env` pointing at the target DB):

```bash
npm run migrate:photos
```

## API

Public:

- `POST /api/logs`: check in by `{ idNumber }`
- `GET /api/people/:id/photo`: person photo
- `GET /api/health`: health check
- `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`

Admin only (requires login):

- `GET /api/people` (`?type=staff|visitor&status=active|revoked`)
- `GET /api/people/stats`
- `GET /api/people/:idNumber`
- `POST /api/people`: multipart form, optional `photo` (JPEG/PNG/WebP, max 4MB)
- `PATCH /api/people/:id/revoke` · `PATCH /api/people/:id/activate`
- `DELETE /api/people/:id`
- `GET /api/logs` (`?date=YYYY-MM-DD` or `?since=<ISO date>`)
- `GET /api/logs/today/count`

## License

ISC

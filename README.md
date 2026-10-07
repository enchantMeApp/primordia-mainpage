# Primordia Admin Console

A read-mostly admin panel for the Primordia game backend, hosted on GitHub Pages.

- **Players online** — live WebSocket connections plus the Redis presence set.
- **Global chat history** — the full `global_chat` table, keyset-paginated, searchable.
- **Server overview** — uptime, memory, Postgres/Redis health, WS count, stats sink.
- **Restart** — schedules a `pm2 restart` of the backend (audited, two-step confirm).
- **Extensible** — add a nav entry in `src/panels/PANELS.ts` plus a `requireAdmin` route in backend `admin.js`.

This folder is the **root of its own git repository**; it has nothing to do with
the game client repo except the vendored theme copies in `src/styles/`.

## Security model

The panel itself is static and public (that's how GitHub Pages works). All real
checks happen on the game backend:

- `POST /api/admin/login` — admin **username/password from `.env`**, compared with
  a constant-time SHA-256 check, rate-limited to 5 attempts / 15 min / IP.
- Returns a short-lived JWT signed with a **separate** `ADMIN_JWT_SECRET` (never
  `JWT_SECRET`). Player tokens are rejected by the marker claim `sub: 'admin'`.
- Every admin endpoint requires that token (`requireAdmin` middleware). No admin
  route is reachable without it.

There is nothing sensitive in this repo. No game secrets, no build keys.

## Local development

```sh
npm ci
npm run dev        # http://localhost:5173, /api proxied to :3000
```

Requires the backend running locally with admin support enabled (see below).

## Building & deploying

```sh
npm run build
```

`dist/` is built with `VITE_API_URL` and a computed `base`. The bundled workflow
(`.github/workflows/deploy.yml`) builds with `VITE_API_URL=https://play.primordiaexe.online`
and deploys every push to `main` to GitHub Pages.

## Sync the game theme

`src/styles/` and `src/assets/main_page.png` are **copies** of the game client's
files so this repo builds standalone. After any theme work in the game:

```sh
node scripts/sync-styles.mjs --from <path-to-game-frontend>
```

## Backend requirements

The server must expose these endpoints (all under `requireAdmin` except login):

| Endpoint | Purpose |
|---|---|
| `POST /api/admin/login` | `{ username, password }` -> `{ token }` |
| `GET /api/admin/session` | validates token -> `{ ok, user }` |
| `GET /api/admin/overview` | health, memory, counts |
| `GET /api/admin/players/online` | connected users + active count |
| `GET /api/admin/chat?before&limit&q` | paginated global chat |
| `GET /api/admin/status` | pm2 process list |
| `POST /api/admin/restart` | schedules `pm2 restart` (202, audited) |

Required backend `.env` values: `ADMIN_PANEL_USER`, `ADMIN_PANEL_PASSWORD`,
`ADMIN_JWT_SECRET`, `ADMIN_JWT_EXPIRES_IN`, and optionally `PM2_RESTART_TARGET`.
The GitHub Pages origin must be added to the backend's `ALLOWED_ORIGINS`.
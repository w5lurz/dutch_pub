# Deployment

The backend (REST API + Socket.io, in `backend/`) ships as a Docker image (see [Dockerfile](Dockerfile)) and runs on Google Cloud Run. The only client is the mobile app in `mobile/`, which is built and distributed separately (EAS; see `mobile/README.md`). Its production build must point `EXPO_PUBLIC_API_URL` at the Cloud Run URL.

## Environment variables / secrets

`.env` files are **never committed** and are **not copied into the Docker image** (see [.dockerignore](.dockerignore)). Every environment must provide these variables itself. The template is [backend/.env.example](backend/.env.example).

| Variable | Required | Description |
|---|---|---|
| `DB_HOST` | yes | MySQL host |
| `DB_PORT` | yes | MySQL port (`3306`; `3307` when connecting from the host to the docker-compose DB) |
| `DB_NAME` | yes | Database name (`dutch_pub`) |
| `DB_USER` | yes | Database user |
| `DB_PASSWORD` | yes | Database password |
| `JWT_SECRET` | yes | Signs the JWT auth tokens (users and guests). The server refuses to start without it |
| `PORT` | no | HTTP port the server listens on (default `3030`; Cloud Run sets it automatically) |
| `CORS_ORIGIN` | no | Comma-separated browser origins allowed to call the API. Native apps send no `Origin`, so this is only needed to run the Expo app in a browser (`npm run web`, e.g. `http://localhost:8081`). Unset = no CORS headers |

Generate a secret value with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Use **different** secrets for local and production. Changing `JWT_SECRET` logs everyone out (the app then asks them to log in again), which is harmless.

## Local development

```sh
cp backend/.env.example backend/.env   # then fill in the values
cd packages/shared && npm install      # shared types/rules/API client, built automatically by the npm scripts
docker compose up db                   # MySQL on localhost:3307
cd backend && npm install && npm start # API + sockets on :3030
cd mobile && npm install && npm start  # Expo dev server; see mobile/README.md
```

## Tests

```sh
cd packages/shared && npm test   # card rules (vitest)
cd backend && npm test           # unit tests, no database needed
cd backend && npm run test:e2e   # starts the real server on a free port against the DB in backend/.env
cd mobile && npm test            # app logic and components (Jest)
```

The e2e tests exercise the REST API, bearer-token auth, guest tokens (incl. name reservation while disconnected), the health endpoint, socket authentication (anonymous / token) and a full socket game flow (rooms, start, reconnect + re-sync, valid/invalid moves, picking up the pile, impersonation, owner-only actions, chat) and a full game played by two bots until one wins (`game-won`, room removal, `played_games` row, leaderboard). They create one `e2e_*` user and one `played_games` row and delete both again. See also [mobile/TESTING.md](mobile/TESTING.md). Run them before deploying.

## Local run with Docker

```sh
docker compose up --build
```

`docker-compose.yml` loads `backend/.env` via `env_file`, and its `environment:` block overrides the DB settings to point at the `db` container. The API is then at http://localhost:3030 (`GET /api/health` → `{"status":"ok"}`).

## Production (Cloud Run)

1. **Store the secrets in Secret Manager** (one-time; repeat `versions add` to rotate):

   ```sh
   printf '%s' "<value>" | gcloud secrets create JWT_SECRET  --data-file=-
   printf '%s' "<value>" | gcloud secrets create DB_PASSWORD --data-file=-
   ```

   Grant the Cloud Run service account `roles/secretmanager.secretAccessor` on them.

2. **Build and deploy** from the repo root:

   ```sh
   gcloud run deploy <service-name> \
     --source . \
     --region <region> \
     --session-affinity \
     --max-instances 1 \
     --set-env-vars "DB_HOST=<host>,DB_PORT=3306,DB_NAME=dutch_pub,DB_USER=<user>" \
     --set-secrets "JWT_SECRET=JWT_SECRET:latest,DB_PASSWORD=DB_PASSWORD:latest"
   ```

   - The server listens on `$PORT` (set by Cloud Run), falling back to 3030 locally.
   - `--session-affinity` + `--max-instances 1`: rooms, games and guests are kept **in memory** (`rooms.js`, `game.js`, `controllers/auth.controller.js`), so all sockets must reach the same instance.
   - Env vars and secrets persist between deploys. On later deploys, only `gcloud run deploy <service-name> --source . --region <region>` is needed, unless a value changes.
   - **Existing service from the web-app days:** `BASE_URL`, `FRONTEND_ROOT` and `COOKIE_SECRET` are no longer used. Remove them once with `--remove-env-vars BASE_URL,FRONTEND_ROOT --remove-secrets COOKIE_SECRET`.

3. **Check the deploy:** `curl https://<service>.a.run.app/api/health` returns `{"status":"ok"}`. Then log in from the app and create a room. If the container exits immediately, check the logs for `... environment variable is not set`.

## Security notes

- `backend/.env` was committed in the past (commits `b5a129f`, `69c6192`), so those old values are public in the git history. The secrets have been replaced since then. **Any DB password from that file must be changed** wherever it is still in use.
- Never put secrets in the `Dockerfile`, `docker-compose.yml` or the mobile app (`EXPO_PUBLIC_*` values are compiled into the app bundle and are public).

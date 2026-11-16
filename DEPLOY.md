# Deployment

The app ships as a single Docker image: the frontend is built in stage 1 and served as static files by the Express backend in stage 2 (see [Dockerfile](Dockerfile)). Production runs on Google Cloud Run.

## Environment variables / secrets

`.env` files are **never committed** and are **not copied into the Docker image** (see [.dockerignore](.dockerignore)). Every environment must provide these variables itself. The template is [backend/.env.example](backend/.env.example).

| Variable | Required | Description |
|---|---|---|
| `DB_HOST` | yes | MySQL host |
| `PORT` | no | HTTP port the server listens on (default `3030`; Cloud Run sets it automatically) |
| `DB_PORT` | yes | MySQL port (`3306`; `3307` when connecting from the host to the docker-compose DB) |
| `DB_NAME` | yes | Database name (`dutch_pub`) |
| `DB_USER` | yes | Database user |
| `DB_PASSWORD` | yes | Database password |
| `BASE_URL` | yes | Public origin of the app, used as the Socket.io CORS origin (e.g. `https://<service>.a.run.app`; `http://localhost:3000` locally) |
| `FRONTEND_ROOT` | yes | Folder with the built frontend. In the Docker image this is `/usr/src/app/build` |
| `COOKIE_SECRET` | yes | Signs the session cookie. The server refuses to start without it |
| `JWT_SECRET` | yes | Signs the JWT auth tokens. The server refuses to start without it |

Generate a secret value with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Use **different** secrets for local and production. Changing `COOKIE_SECRET` or `JWT_SECRET` logs everyone out, which is harmless.

The frontend build reads `REACT_APP_BASE_URL`, which is set in the [Dockerfile](Dockerfile). It is a public URL, not a secret.

## Local development

```sh
cp backend/.env.example backend/.env   # then fill in the values
cd packages/shared && npm install      # shared types/rules/API client, built automatically by the frontend's npm scripts
docker compose up db                   # MySQL on localhost:3307
cd backend && npm install && npm start # API + sockets on :3030
cd frontend && npm install && npm start # CRA dev server on :3000
```

## Tests

```sh
cd packages/shared && npm test   # card rules (vitest)
cd backend && npm test           # unit tests, no database needed
cd backend && npm run test:e2e   # starts the real server on a free port against the DB in backend/.env
```

The e2e tests exercise the REST API, cookie and bearer-token auth, guest tokens, SPA routing, socket authentication (anonymous / token / cookie) and a full socket game flow (rooms, start, valid/invalid moves, impersonation, owner-only actions, chat). They create one `e2e_*` user and delete it again. Run them before deploying.

## Local full-stack run with Docker

```sh
docker compose up --build
```

`docker-compose.yml` loads `backend/.env` via `env_file`, and its `environment:` block overrides the DB settings to point at the `db` container. The app is then at http://localhost:3030.

## Production (Cloud Run)

1. **Store the secrets in Secret Manager** (one-time; repeat `versions add` to rotate):

   ```sh
   printf '%s' "<value>" | gcloud secrets create COOKIE_SECRET --data-file=-
   printf '%s' "<value>" | gcloud secrets create JWT_SECRET    --data-file=-
   printf '%s' "<value>" | gcloud secrets create DB_PASSWORD   --data-file=-
   ```

   Grant the Cloud Run service account `roles/secretmanager.secretAccessor` on them.

2. **Build and deploy** from the repo root:

   ```sh
   gcloud run deploy <service-name> \
     --source . \
     --region <region> \
     --session-affinity \
     --max-instances 1 \
     --set-env-vars "DB_HOST=<host>,DB_PORT=3306,DB_NAME=dutch_pub,DB_USER=<user>,BASE_URL=https://<service>.a.run.app,FRONTEND_ROOT=/usr/src/app/build" \
     --set-secrets "COOKIE_SECRET=COOKIE_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,DB_PASSWORD=DB_PASSWORD:latest"
   ```

   - The server listens on `$PORT` (set by Cloud Run), falling back to 3030 locally.
   - `--session-affinity` + `--max-instances 1`: rooms, games and guests are kept **in memory** (`rooms.js`, `game.js`, `guests.js`), so all sockets must reach the same instance.
   - Env vars and secrets persist between deploys. On later deploys, only `gcloud run deploy <service-name> --source . --region <region>` is needed, unless a value changes.

3. **Check the deploy:** open the service URL, log in, and create a room. If the container exits immediately, check the logs for `... environment variable is not set`.

## Security notes

- `backend/.env` was committed in the past (commits `b5a129f`, `69c6192`), so those old values are public in the git history. The cookie and JWT secrets have been replaced since then. **Any DB password from that file must be changed** wherever it is still in use.
- Never put secrets in the `Dockerfile`, `docker-compose.yml` or frontend code (`REACT_APP_*` values end up in the public JS bundle).

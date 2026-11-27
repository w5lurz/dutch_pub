# Dutch Pub mobile

The Expo (React Native) app for Dutch Pub, the only client of the backend (`../backend`). It shares types, game rules, socket event types and the REST client with the backend through `../packages/shared`.

## Setup

```sh
cd ../packages/shared && npm install   # once; built automatically by the scripts below
cd ../../mobile && npm install
cp .env.example .env.local             # then set EXPO_PUBLIC_API_URL
```

`EXPO_PUBLIC_API_URL` must be reachable **from the device**. `localhost` only works for the iOS simulator and web:

| Running on | URL |
|---|---|
| Physical phone (Expo Go / dev build) | `http://<your computer's LAN IP>:3030` |
| Android emulator | `http://10.0.2.2:3030` |
| iOS simulator, web | `http://localhost:3030` |

Start the backend (`cd ../backend && npm start`), then:

```sh
npm start          # Expo dev server; scan the QR code with Expo Go
npm run android    # / npm run ios / npm run web
```

`npm run web` runs the app in a browser, which needs CORS: start the backend with `CORS_ORIGIN=http://localhost:8081`.

## Checks

```sh
npm run typecheck
npm run lint
npm test           # Jest + React Native Testing Library
npx expo-doctor
```

See [TESTING.md](TESTING.md) for all automated tests and the manual test matrix.

Always add dependencies with `npx expo install <package>`, which picks versions compatible with the Expo SDK.

## Beta APK (EAS Build)

The APK is built in the cloud by EAS (no Android SDK or Java needed locally). App id: `hu.dutchpub.app`. Profiles are in [eas.json](eas.json): `preview` = installable APK for testers, `development` = dev client APK, `production` = store build (AAB). On EAS, `eas-build-post-install` builds `packages/shared` (its `dist` is not in git).

Values the app needs at build time come from **EAS environment variables**, never from git (`.env.local` is not uploaded):

| Variable | Environment | Value |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | preview | the backend's public HTTPS address, e.g. the tunnel below |
| `EXPO_PUBLIC_SENTRY_DSN` | preview (optional) | Sentry project DSN; crash reporting stays off without it |

### Backend for the beta: a tunnel from this PC

The backend runs on this PC (`docker compose up db`, `cd backend && npm start`) and a tunnel gives it a fixed HTTPS address. The address is built into the APK, so it must not change: use ngrok's free **static domain** (a Cloudflare quick tunnel gets a new address every start).

1. Sign up at ngrok.com (free), copy your authtoken, and claim the free static domain (Dashboard → Domains), e.g. `something.ngrok-free.app`.
2. `winget install ngrok.ngrok`, then `ngrok config add-authtoken <your token>` (stored in your user profile, not in the repo).
3. While playing: `ngrok http --domain=something.ngrok-free.app 3030` (newer ngrok versions also accept `--url=`). Games only work while this PC, the database, the backend and ngrok are running. Check it at `https://something.ngrok-free.app/api/health`; ngrok's "endpoint is offline" page (ERR_NGROK_3200) means ngrok isn't running.

### After restarting this PC (to host the beta again)

Nothing starts by itself. Before anyone plays, in three terminals from the repo root:

1. **Database:** start Docker Desktop and wait until it says it is running, then `docker compose up db`.
2. **Backend:** `cd backend` and `npm start` (builds `packages/shared` first). Wait for `Listening on port 3030`.
3. **Tunnel:** `ngrok http --domain=<your ngrok domain> 3030`. Wait for the `Forwarding https://… -> http://localhost:3030` line. The domain is the one the APK was built with: `cd mobile` and `npx eas-cli env:list --environment preview` shows it (`EXPO_PUBLIC_API_URL`).
4. **Check:** open `https://<your ngrok domain>/api/health` in a browser: `{"status":"ok"}` (click "Visit Site" if ngrok shows its notice first). ngrok's "endpoint is offline" page means step 3 isn't running; a 502 / connection error means step 2 isn't.

Keep all three terminals open while people play. Running games live in the backend's memory, so restarting the backend (or the PC) ends them; accounts, avatars and the leaderboard are kept in the database.

If ngrok says its agent is too old (ERR_NGROK_121): `ngrok update`. If it rejects the authtoken (ERR_NGROK_105): copy it again from the ngrok dashboard ("Your Authtoken", not an API key) and `ngrok config add-authtoken <token>`.

### Build and share

```sh
cd mobile
npx eas-cli login                       # your Expo account (once)
npx eas-cli init                        # links the project (adds its id to app.json, once)
npx eas-cli env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://something.ngrok-free.app --visibility plaintext
npx eas-cli build --platform android --profile preview
```

The build runs in the cloud (~10–20 min on the free plan) and ends with a download link and QR code. Send the link to the testers: they open it on their Android phone, download the APK and allow "install unknown apps" for their browser. New builds install over the old one (same app id and signing key, kept by EAS). iPhones cannot install APKs (TestFlight needs an Apple Developer account).

Crash reports: create a Sentry project (React Native), add its DSN as `EXPO_PUBLIC_SENTRY_DSN` for `preview` and rebuild. Source maps are not uploaded yet (`SENTRY_DISABLE_AUTO_UPLOAD` in eas.json); stack traces then point into the bundle. To upload them, set `SENTRY_ORG`, `SENTRY_PROJECT` and a secret `SENTRY_AUTH_TOKEN` as EAS variables and remove that flag.

## Structure

| Path | Contents |
|---|---|
| `src/app/` | Screens and layouts (Expo Router: every file is a route): root Stack with `login`, `registration`, `game` |
| `src/app/(tabs)/` | Bottom tabs: Home (`index`), `play`, `leaderboard`, `account` |
| `src/components/` | Reusable app components (toast, connection banner, …) |
| `src/components/ui/` | UI primitives: `Button`, `TextField`, `Screen`, `SegmentedControl` (import from `@/components/ui`) |
| `src/components/icons/` | SVG icons (logo, card suits, card back, chat, close), ported from the former web app |
| `src/providers/` | Context providers: socket connection, `GameSync` (mirrors every server event into the store) |
| `src/store/` | Redux store and slices |
| `src/lib/` | Config, API client, app-level types |

Styling uses [NativeWind](https://www.nativewind.dev/) v4 (Tailwind CSS v3 classes via `className`).

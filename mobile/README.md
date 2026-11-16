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
npx expo-doctor
```

Always add dependencies with `npx expo install <package>`, which picks versions compatible with the Expo SDK.

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

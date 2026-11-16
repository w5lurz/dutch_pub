# Dutch Pub mobile

The Expo (React Native) app for Dutch Pub. It talks to the same backend as the web app (`../backend`) and shares types, game rules, socket event types and the REST client with it through `../packages/shared`.

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
| `src/components/icons/` | SVG icons ported from the web (logo, card suits, card back, chat, close) |
| `src/providers/` | Context providers: socket connection, `GameSync` (mirrors every server event into the store) |
| `src/store/` | Redux store and slices (same as the web app) |
| `src/lib/` | Config, API client, app-level types |

Styling uses [NativeWind](https://www.nativewind.dev/) v4 (Tailwind CSS v3 classes via `className`).

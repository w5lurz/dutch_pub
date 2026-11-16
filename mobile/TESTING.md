# Testing

## Automated

| Where | Command | What |
|---|---|---|
| `packages/shared` | `npm test` | Card rules (`canLayCard`, `hasAnyPlayableCard`), vitest |
| `backend` | `npm test` | Unit tests, no database needed |
| `backend` | `npm run test:e2e` | The real server on a free port against the DB in `backend/.env`: REST, tokens, sockets, a full 2-player game played by bots to a win (leaderboard row created and removed again) |
| `mobile` | `npm test` | Jest (`jest-expo`) + React Native Testing Library: game helpers, card / opponent / board components, `useGameActions` (moves, auto pick-up) |

Mobile tests live next to the code in `__tests__/` folders. Gestures can't be driven in Jest, so card tests use the screen-reader actions instead (`activate` = tap to select, `play` = what a drop on the laid pile does).

## Manual test matrix

Run before a release, with the backend reachable from all devices. Mix platforms in the same room: **Android (Expo Go / dev build)**, **iOS** and **web** (`npm run web`, backend with `CORS_ORIGIN=http://localhost:8081`). Use a private window for a second web player.

### Accounts

- [ ] Register, log in, log out, log in again; the session survives an app restart.
- [ ] Join as a guest; the guest name stays taken while that guest is away.
- [ ] Wrong password / unknown user / taken name show a message.

### Rooms

- [ ] Create a public and a private room (2, 3, 4 slots); guests can't join private rooms.
- [ ] Join, leave, delete (owner only), start (owner, 2+ players): every device updates without a refresh.

### Game (2, 3 and 4 players)

- [ ] The game screen turns landscape; the other screens stay portrait; Android back is blocked in a game.
- [ ] Opponents: hand fan with count, face-up cards on their face-down stacks, green tile on their turn.
- [ ] Tap selects a card (lifts, blue outline), tap again deselects.
- [ ] Drag a card onto the laid pile to play it; anywhere else it flies back; an illegal card flies back with a message.
- [ ] Face-up cards only after the hand is empty; face-down only after the face-up ones; a failed blind card picks up the pile.
- [ ] No playable card: the pile is picked up automatically, once.
- [ ] "Clear all" (10) and four of a kind burn the pile.
- [ ] Chat: unread badge, 3 s cooldown, works with the keyboard open in landscape.
- [ ] Winning: every player sees the winner, everyone lands on the leaderboard, the new win is listed.

### Interruptions

- [ ] Put the app in the background mid-game for 10 s and for 2+ minutes, then return: same cards, same turn.
- [ ] Airplane mode mid-game, then back: the connection banner shows and clears, the state re-syncs.
- [ ] Restart the backend mid-game: the app reconnects (the game itself is lost: state is in memory, PLAN.md risk 3).
- [ ] Kill and reopen the app while in a game: it goes straight back into the game.

### Look

- [ ] Light and dark mode (system setting) on every screen; card faces stay light.
- [ ] A small phone (e.g. 360dp tall in landscape) and a tablet: cards readable, nothing cut off; long hands scroll.
- [ ] Animations: laid card zooms in, cards slide in / out, burnt pile fades in.

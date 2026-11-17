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
- [ ] Avatars: a new account shows the avatar generated from its name (the same on every device). Account → "Change avatar": pick one; it shows at once on the Account screen, in your room card, at your seat and at the other players' tables (also mid-game), and on the leaderboard; it survives log out / log in, an app restart and a second device. "Use my generated one" goes back. Guests see their generated avatar with a note and no picker. Saving offline shows an error and keeps the old one. (Dev: Account tab → Avatars, or /dev/avatars, shows all presets.)

### Rooms

- [ ] Create a public and a private room (2, 3, 4 slots); guests can't join private rooms.
- [ ] Join, leave, delete (owner only), start (owner, 2+ players): every device updates without a refresh.
- [ ] Room settings: set "Show card powers" off when creating a room; the owner changes it in the room's Settings sheet and every player's room card shows it right away; other players see it read-only; after the start it can't be changed.

### Game (2, 3 and 4 players)

- [ ] The game opens in portrait; turning the phone switches to the wide layout and back (the other screens stay portrait); Android back is blocked in a game.
- [ ] Seats follow the turn order clockwise from you (you at the bottom): portrait 2p top, 3p top-left / top-right, 4p left / top / right; wide 2p top, 3p left / right (upper half), 4p left / top / right. The same player sits in the same place on every device relative to its owner.
- [ ] Opponents: avatar (chosen, or generated from the name) and name, hand as a fan of backs without a number ("×N" only when it is too long), face-up cards on their face-down stacks; side seats' cards turned toward the centre, text upright; a green glow around the avatar of whoever is on turn (yours too).
- [ ] Tap selects a card (lifts, blue outline), tap again deselects.
- [ ] Drag a card onto the laid pile to play it; anywhere else it flies back; an illegal card flies back with a message. In both layouts, and from your table stacks too.
- [ ] Turn the phone while dragging a card: the drag is dropped, the card is back in your hand, nothing is played.
- [ ] Face-up cards only after the hand is empty; face-down only after the face-up ones; a failed blind card picks up the pile.
- [ ] No playable card: the pile is picked up automatically, once.
- [ ] "Clear all" (10) and four of a kind burn the pile.
- [ ] Chat (button bottom left): unread badge, 3 s cooldown, works with the keyboard open in both layouts.
- [ ] Winning: every player sees the winner, everyone lands on the leaderboard, the new win is listed.

### Interruptions

- [ ] Put the app in the background mid-game for 10 s and for 2+ minutes, then return: same cards, same turn.
- [ ] Airplane mode mid-game, then back: the connection banner shows and clears, the state re-syncs.
- [ ] Restart the backend mid-game: the app reconnects (the game itself is lost: state is in memory, PLAN.md risk 3).
- [ ] Kill and reopen the app while in a game: it goes straight back into the game.

### Look

- [ ] Light and dark mode (system setting) on every screen; card faces stay light.
- [ ] Portrait on a small phone (360×640dp) with 4 players and a 10+ card hand: every seat, the piles, your stacks and the hand fit; the hand is a fan (tilted cards on an arc) that closes up to fit, every card's corner index visible (try 20+ cards); a tilted card straightens when dragged and tilts back when it flies home.
- [ ] Portrait on a tall phone (360×800dp, 20:9): the table photo is not visibly distorted.
- [ ] Wide: a phone turned sideways (your stacks beside the hand), a tablet in both orientations, the desktop browser; a narrow browser window gets the portrait layout. Cards readable, nothing cut off.
- [ ] The dev preview (Account tab → table preview, or /dev/table) shows the layout name and window size on its first chip; check 2, 3 and 4 players, "Opp. hands: many", hand 15, in both layouts.
- [ ] Animations: laid card zooms in, cards slide in / out, burnt pile fades in.
- [ ] Realistic look: cards have a soft shadow and paper shading; the laid pile is a little messy (cards below peek out, each card keeps its tilt), the deck shows its thickness (thinner as it runs out), the burnt pile is a heap of backs only; table cards lie a little crooked. On a short landscape screen the hand hangs partly off the bottom edge. Check that drag & drop is smooth on a mid-range Android (shadows on ~30 cards).

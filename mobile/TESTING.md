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
- [ ] Staying logged in: leave the app logged in (as a user and as a guest) for more than 2 hours, also with the phone asleep, then use it: still logged in, no "Please log in again". After logging out, the old session is gone for good.
- [ ] Join as a guest; the guest name stays taken while that guest is away.
- [ ] Wrong password / unknown user / taken name show a message.
- [ ] Password fields (log in, registration: both): the eye button on the right shows the password, tapping again hides it; it is disabled while signing in.
- [ ] Avatars: a new account shows the avatar generated from its name (the same on every device). Account → "Change avatar": pick one; it shows at once on the Account screen, in your room card, at your seat and at the other players' tables (also mid-game), and on the leaderboard; it survives log out / log in, an app restart and a second device. "Use my generated one" goes back. Guests see their generated avatar with a note and no picker. Saving offline shows an error and keeps the old one. (Dev: Account tab → Avatars, or /dev/avatars, shows all presets.)

### Rooms

- [ ] Create a public and a private room (2, 3, 4 slots); guests can't join private rooms.
- [ ] Join, leave, delete (owner only), start (owner, 2+ players): every device updates without a refresh.
- [ ] The server refuses what the app hides (e.g. two phones racing for the last seat): a full room, a started game, a second room, a guest in a private room each show a message.
- [ ] Room settings: set "Show card powers" off when creating a room; the owner changes it in the room's Settings sheet and every player's room card shows it right away; other players see it read-only; after the start it can't be changed.
- [ ] Visibility in the room's Settings sheet: the owner switches Private / Public; every device's room list updates at once (guests can no longer join a room made private; guests already in it stay); other players see it read-only; after the start it can't be changed.

### Game (2, 3 and 4 players)

- [ ] The game opens in portrait; turning the phone switches to the wide layout and back (the other screens stay portrait); Android back is blocked in a game.
- [ ] Seats follow the turn order clockwise from you (you at the bottom): portrait 2p top, 3p top-left / top-right, 4p left / top / right; wide 2p top, 3p left / right (upper half), 4p left / top / right. The same player sits in the same place on every device relative to its owner.
- [ ] Opponents: avatar (chosen, or generated from the name) and name, hand as a fan of backs without a number ("×N" only when it is too long), face-up cards on their face-down stacks; side seats' cards turned toward the centre, text upright; a green glow around the avatar of whoever is on turn (yours too).
- [ ] Swap phase (right after the deal): the middle of the table shows "Swap your cards" with a Ready button and "N / M ready"; your face-up cards are full size. Tap a hand card, then a face-up card (or the other way round): they trade places, and the others see your new face-up card. Laying a card is refused ("Swap your cards first…"). Opponents who are ready get a green ✓ before their name. After Ready you can't swap any more; when everyone is ready the piles appear and the first player's turn starts.
- [ ] Missed blind card: when only face-down cards are left and the one you turn up doesn't fit, it lands on the pile and everyone sees "<name>'s blind <card> doesn't fit! Picking up…" in red for ~3 s; nobody can play meanwhile; then that player picks up the whole pile (the cards fly into their hand) and the turn passes.
- [ ] Turn glow: the avatar of whoever is on turn (yours too) has a green halo with green rings rippling out of it again and again; with "reduce motion" only the halo.
- [ ] Turn timer: the room's Settings has "Turn timer" (Off / 15s / 30s / 1m, new rooms 30s); room cards show it ("30s turns" / "No turn timer"). In a game, whoever is on turn (you too) has a countdown pill by their name, red for the last 5 s; none during the swap phase or a missed blind card, none with the timer Off. When it runs out, nothing is laid or picked up and the next player is on: the skipped player sees "Time's up! Your turn was skipped.", the others "<name> ran out of time.". Laying a card restarts the full time for the next turn. Dev table: "Timer" chip (15 s).
- [ ] Tap selects a card (lifts, blue outline), tap again deselects.
- [ ] Several cards at once: tap more cards of the same value (in your hand, or among your face-up cards once the hand is empty) and they are all selected, with "N selected · drag one to lay all" next to your name; tapping a card of another value starts a new selection. Drag any selected card onto the pile: all of them are laid (the last one on top), the hand refills to 3 from the deck, the turn passes. Laying them so that four of a kind are on top burns the pile and you play again; several 10s burn it too. Mixed values or a first card that doesn't fit are refused with a message. Face-down cards stay one at a time.
- [ ] 4 players (two decks): holding two identical cards (e.g. two 7♥), playing one leaves the other in your hand.
- [ ] Drag a card onto the laid pile to play it; anywhere else it flies back; an illegal card flies back with a message. In both layouts, and from your table stacks too.
- [ ] Turn the phone while dragging a card: the drag is dropped, the card is back in your hand, nothing is played.
- [ ] Table spots: play a face-up card from the middle spot: the other cards stay where they are (its face-down card shows alone in the middle); the opponents see the same. Face-down cards are played from the spot you drag.
- [ ] Face-up cards only after the hand is empty; face-down only after the face-up ones; a failed blind card picks up the pile.
- [ ] No playable card: the pile is picked up automatically, once.
- [ ] "Clear all" (10) and four of a kind burn the pile.
- [ ] Chat (button bottom left): unread badge, 3 s cooldown, works with the keyboard open in both layouts.
- [ ] Winning: every player sees the winner, everyone lands on the leaderboard, the new win is listed.
- [ ] Winner's shot: when someone wins, on every device a flaming shot glass of clear liquor slides from the table's middle (its tongue of fire streaming out behind it) and stops beside the winner (an opponent's seat, on the side facing the middle; or right of your own avatar and name), the liquor sloshing as it stops; then the flame stands up and flickers, with an orange glow on the table. It stays until the game closes (~4.5 s). With "reduce motion" it just fades in. Dev table: "Win: you" / "Win: Julcsi".
- [ ] Big pick-up: when anyone picks up more than 6 cards (also a failed blind card plus the pile), every device shows an old librarian with glasses coming up from the bottom, putting a book on the shelf and going down again (~4 s), with "<name> is the librarian now" (and "picked up N cards") above her. No touches blocked; with "reduce motion" she just fades in and out. Dev table: "Librarian: you" / "Librarian: Julcsi".
- [ ] Stop game (room owner only): a red stop button above the chat button, only on the owner's device. It asks first ("Stop the game?"; "Keep playing" or the backdrop closes it). Confirmed: every player sees "<owner> stopped the game." ("You stopped the game." for the owner) and lands on Play at once; the room is gone from the list, the leaderboard is unchanged. A player whose app was in the background leaves the game when they come back (without the message; they land on the leaderboard).
- [ ] Owner gone: the owner kills the app (or loses the connection) mid-game. Coming back within 2 minutes, the game goes on. Gone for 2 minutes: everyone sees "The game was stopped: <owner> (the room owner) was gone for 2 minutes." and lands on Play; the room is gone.

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
- [ ] Night (lamp): with the phone in dark mode the table is night (lamp button bottom-right shows "A" = follows the phone). Tap the lamp: day / night switch with a short fade, only on this phone; it is remembered after restarting the app. Long press: back to following the phone. At night names and pile titles are light on dark pills, the piles sit in a warm light pool, your hand is a little darker but readable (red cards too), and a dragged card looks lit like the others. Day mode looks as before.
- [ ] Day visitors: by day, now and then (first after ~6–12 s, then every ~20–40 s) a bee buzzes across or a butterfly drifts over the table; very rarely (about 1 in 16 visits) a red or blue frisbee spins over it with its shadow on the table. They never block touches, don't come at night or with the phone's "reduce motion" on. The dev table's Bee / Butterfly / Frisbee chips call one in at once.
- [ ] Night extras: at night the lamp's dark shade and bright underside peek in at the top edge's middle (in the status bar area, with a soft warm glow), not covering the top opponent's avatar or name; it fades in / out with the lamp switch. Every ~5–12 s the light flickers briefly (2–4 quick, subtle dips of the whole table and the lamp's glow, not strobe-like). Now and then (first after ~8–15 s, then every ~20–45 s) a small moth flies in, circles the lamp erratically for a few seconds facing where it flies, with fluttering wings, and flies off. Card shadows fall a little further downward at night. None of it takes touches or is read by the screen reader; with the system's "reduce motion" on there is no flicker and no moth (the lamp drawing stays). Nothing of it by day.

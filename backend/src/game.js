import { canLayCard, isCallNext, isReverse, normalizeRoomSettings } from '@dutch-pub/shared';
import { emptySocketRoom, games, modifyRooms, roomsList } from './rooms.js';
import { modifyRoomMessages, roomMessages } from './chat.js';
import { identityError } from './socketAuth.js';
import { notifyTurn } from './push.js';

import db from './models/index.js';
const PlayedGame = db.played_game;

/** How long a missed blind card stays on the pile before its player picks the pile up (env for tests). */
const BLIND_REVEAL_MS = Number(process.env.BLIND_REVEAL_MS ?? 3000);
/** One second of the room's turn timer, in ms (env for tests, which run the clock faster). */
const TURN_SECOND_MS = Number(process.env.TURN_SECOND_MS ?? 1000);

/** The running turn clock of each game (cleared when the turn changes, the game ends or is stopped). */
const turnClocks = new WeakMap();

/** Stops game `game`'s turn clock (no turn is timed meanwhile). */
export const clearTurnClock = game => {
    clearTimeout(turnClocks.get(game));
    turnClocks.delete(game);
    game.turnEndsAt = null;
    game.turnTime = null;
};

/**
 * Time ran out for whoever is on turn in `game`: their turn is skipped (nothing laid, nothing
 * picked up), the next player is on. Returns the skipped player's name, or undefined.
 */
export const timeOutTurn = game => {
    const entry = Object.entries(game.players).find(([, player]) => player.active);
    if (!entry) return undefined;
    game.call = null;
    setActivePlayerNext(game);
    return entry[0];
};

/**
 * (Re)starts the turn clock of game `game` in room `roomId`: call it whenever a new turn
 * starts, before the new view is sent (the view carries the time left). No clock while the
 * room's timer is off, in the swap phase, during a missed blind card, or once the game is
 * gone. When it runs out, the turn is skipped (`timeOutTurn`), everyone gets
 * `turn-timed-out` and the new view, and the next turn's clock starts.
 */
export const startTurnClock = (io, roomId, game) => {
    clearTurnClock(game);
    // Whoever is on turn now gets a notification if the app is away (with or without a timer).
    notifyTurn(io, roomId, game);
    const room = roomsList[roomId];
    const limit = normalizeRoomSettings(room?.settings).turnTimer * TURN_SECOND_MS;
    if (!room || games[roomId] !== game || game.phase === 'swap' || game.blindMiss || limit <= 0) return;
    game.turnEndsAt = Date.now() + limit;
    game.turnTime = limit;
    turnClocks.set(
        game,
        setTimeout(() => {
            turnClocks.delete(game);
            if (games[roomId] !== game || game.blindMiss) return;
            const skipped = timeOutTurn(game);
            if (!skipped) return;
            io.to(`game-${roomId}`).emit('turn-timed-out', skipped);
            startTurnClock(io, roomId, game);
            sendUiDataToSocket(io, roomsList[roomId] ?? room, game, 'game-updated');
        }, limit),
    );
};

/**
 * Ends a missed blind card's moment (`game.blindMiss`): its player picks up the pile with it and
 * the next player is on. Nothing when the game was stopped or finished meanwhile.
 */
export const finishBlindMiss = (io, roomId, game) => {
    if (games[roomId] !== game || !game.blindMiss) return;
    const { username } = game.blindMiss;
    game.blindMiss = null;
    game.players[username].userCards.hand = [...game.laidCards].sort((a, b) => a.value - b.value);
    game.laidCards = null;
    game.call = null;
    setActivePlayerNext(game);
    startTurnClock(io, roomId, game);
    if (roomsList[roomId]) sendUiDataToSocket(io, roomsList[roomId], game, 'cards-drawn');
};

/**
 * Checks that `socket` is authenticated as `username` and plays in game `roomId`.
 * Returns `{ error }` or `{ player, game }` (the server-side player and game state).
 */
const validatePlayer = (socket, { roomId, username }) => {
    const authError = identityError(socket, username);
    if (authError) {
        return { error: authError };
    }
    const currentRoom = roomsList[roomId];
    const currentGame = games[roomId];
    if (!currentRoom || !currentGame) {
        return { error: 'This game does not exist.' };
    }
    const player = currentGame.players[username];
    const roomPlayer = currentRoom.players.find(roomPlayer => roomPlayer.username === username);
    if (!player || !roomPlayer || roomPlayer.socketId !== socket.id) {
        return { error: 'You are not a player in this game.' };
    }
    return { player, game: currentGame };
};

/**
 * Like `validatePlayer`, and that cards can be played now (the swap phase is over, no
 * missed blind card is being shown) and it is their turn. Returns `{ error }` or `{ player }`.
 */
const validateTurn = (socket, { roomId, username }) => {
    const { error, player, game } = validatePlayer(socket, { roomId, username });
    if (error) {
        return { error };
    }
    if (game.phase === 'swap') {
        return { error: 'Swap your cards first, then tap Ready.' };
    }
    if (game.blindMiss) {
        return { error: 'Wait a moment, the pile is being picked up.' };
    }
    if (!player.active) {
        return { error: 'It is not your turn.' };
    }
    return { player };
};

/**
 * Swap phase: hand card `hand` and face-up card `faceUp` of `username` trade places (one
 * copy each; the face-up card keeps its spot). Returns an error message, or null.
 */
export const swapCards = (game, username, hand, faceUp) => {
    const player = game.players[username];
    if (game.phase !== 'swap') return 'Cards can only be swapped before the game starts.';
    if (player.ready) return 'You are ready already.';
    const same = wanted => own => wanted && own && own.value === wanted.value && own.color === wanted.color;
    const handIndex = player.userCards.hand.findIndex(same(hand));
    const faceUpIndex = player.userCards.tableFlipped.findIndex(same(faceUp));
    if (handIndex < 0 || faceUpIndex < 0) return "You don't have that card.";
    const fromHand = player.userCards.hand[handIndex];
    player.userCards.hand[handIndex] = player.userCards.tableFlipped[faceUpIndex];
    player.userCards.tableFlipped[faceUpIndex] = fromHand;
    return null;
};

/** Swap phase: `username` is done swapping; once everyone is, the play phase starts. Returns whether it started. */
export const markReady = (game, username) => {
    game.players[username].ready = true;
    if (game.phase === 'swap' && Object.values(game.players).every(player => player.ready)) {
        game.phase = 'play';
        return true;
    }
    return false;
};

/**
 * Checks a `lay-card` request against the server-side game state.
 * Returns `{ error }` when the move must be rejected, otherwise `{ card }`: the server's own
 * copy of the card (so client-sent flags like isMagicCard are never trusted), or the
 * face-down table card index for a blind play. With `cards` (several cards laid together)
 * it returns `{ card, cards }`: the server's copies, one per requested card (two requests
 * for the same card need two copies, possible with two decks), all of the same value, the
 * first one fitting the pile.
 */
export const validateLayCard = (socket, { card, cards, roomId, username }) => {
    const { error, player } = validateTurn(socket, { roomId, username });
    if (error) {
        return { error };
    }
    const currentGame = games[roomId];

    const { hand } = player.userCards;
    const tableFlipped = present(player.userCards.tableFlipped);
    const table = present(player.userCards.table);
    if (typeof card === 'number') {
        if (hand.length !== 0 || tableFlipped.length !== 0) {
            return { error: 'You have to play your other cards first.' };
        }
        // The how-manieth face-down card still there (left to right), not the spot.
        if (!Number.isInteger(card) || card < 0 || card >= table.length) {
            return { error: 'That card does not exist.' };
        }
        // Blind card: whether it fits the pile is decided after revealing it.
        return { card };
    }

    const playableCards = hand.length !== 0 ? hand : tableFlipped;
    if (Array.isArray(cards) && cards.length > 0) {
        const pool = [...playableCards];
        const serverCards = [];
        for (const requested of cards) {
            const i = requested ? pool.findIndex(own => own.value === requested.value && own.color === requested.color) : -1;
            if (i < 0) {
                return { error: "You don't have that card." };
            }
            serverCards.push(pool.splice(i, 1)[0]);
        }
        if (serverCards.some(own => own.value !== serverCards[0].value)) {
            return { error: 'Only cards of the same value can be laid together.' };
        }
        if (!canLayCard(serverCards[0], currentGame.laidCards, currentGame.rules)) {
            return { error: 'You cannot lay that card.' };
        }
        return { card: serverCards[0], cards: serverCards };
    }
    const serverCard = card && playableCards.find(ownCard => ownCard.value === card.value && ownCard.color === card.color);
    if (!serverCard) {
        return { error: "You don't have that card." };
    }
    if (!canLayCard(serverCard, currentGame.laidCards, currentGame.rules)) {
        return { error: 'You cannot lay that card.' };
    }
    return { card: serverCard };
};

export const game = io => {
    io.on('connection', socket => {
        socket.on('lay-card', async payload => {
            const { cardIndex, roomId, username, call } = payload;
            const validation = validateLayCard(socket, payload);
            if (validation.error) {
                console.log('LAY CARD REJECTED', validation.error, payload);
                socket.emit('lay-card-rejected', validation.error);
                return;
            }
            const currentRoom = roomsList[roomId];
            const currentGame = games[roomId];
            const userCards = currentGame.players[username].userCards;

            if (typeof validation.card === 'number') {
                // A face-down card, played blind: revealed now, it either fits the pile or the
                // player picks up the pile together with it.
                // The n-th face-down card still there; its spot stays (empty) so the others keep theirs.
                const spot = nthCardSpot(userCards.table, validation.card);
                const blindCard = userCards.table[spot];
                userCards.table = userCards.table.map((own, i) => (i === spot ? null : own));
                if (!canLayCard(blindCard, currentGame.laidCards, currentGame.rules)) {
                    // It doesn't fit: first everyone sees it on top of the pile for a moment (no
                    // moves meanwhile), then its player picks up the pile with it.
                    currentGame.laidCards = [blindCard, ...(currentGame.laidCards ?? [])];
                    currentGame.blindMiss = { username, card: blindCard };
                    clearTurnClock(currentGame);
                    sendUiDataToSocket(io, currentRoom, currentGame, 'game-updated');
                    setTimeout(() => finishBlindMiss(io, roomId, currentGame), BLIND_REVEAL_MS);
                    return;
                }
                applyLay(currentGame, username, [blindCard], cardIndex, { fromTable: true });
            } else {
                applyLay(currentGame, username, validation.cards ?? [validation.card], cardIndex, { call });
            }

            const won = userCards.hand.length === 0 && present(userCards.tableFlipped).length === 0 && present(userCards.table).length === 0;
            if (won) {
                const gameId = `game-${roomId}`;
                const { [roomId]: _won, ...rest } = roomsList;
                modifyRooms(rest);
                // The game is over: free it (the players' last view is sent below from `currentGame`).
                delete games[roomId];
                io.to(gameId).emit('game-won', username, roomsList);
                emptySocketRoom(io, gameId);
                const { [gameId]: _messages, ...restRoomMessages } = roomMessages;
                modifyRoomMessages(restRoomMessages);
            }

            // A new turn (the next player's, or the same player's again after a burn); no clock once won.
            if (won) clearTurnClock(currentGame);
            else startTurnClock(io, roomId, currentGame);
            sendUiDataToSocket(io, currentRoom, currentGame, 'card-laid');
            if (won) {
                await PlayedGame.create({
                    winner: username,
                    players: currentRoom.players.map(player => player.username).join(','),
                });
            }
        });

        // Swap phase: a hand card and a face-up card trade places; everyone sees the new face-up cards.
        socket.on('swap-cards', payload => {
            const { roomId, username, hand, faceUp } = payload ?? {};
            const { error, game: currentGame } = validatePlayer(socket, { roomId, username });
            const swapError = error ?? swapCards(currentGame, username, hand, faceUp);
            if (swapError) {
                socket.emit('action-rejected', swapError);
                return;
            }
            sendUiDataToSocket(io, roomsList[roomId], currentGame, 'game-updated');
        });

        // Swap phase: a player is done swapping; with everyone ready the play phase starts.
        socket.on('player-ready', payload => {
            const { roomId, username } = payload ?? {};
            const { error, game: currentGame } = validatePlayer(socket, { roomId, username });
            if (error || currentGame.phase !== 'swap') {
                socket.emit('action-rejected', error ?? 'The game has started already.');
                return;
            }
            // With everyone ready the first turn starts, and its clock.
            if (markReady(currentGame, username)) startTurnClock(io, roomId, currentGame);
            sendUiDataToSocket(io, roomsList[roomId], currentGame, 'game-updated');
        });

        socket.on('get-game-state', () => {
            socket.emit('game-state', buildGameState(socket.data.user?.username));
        });

        socket.on('draw-cards', ({ roomId, username }) => {
            const { error } = validateTurn(socket, { roomId, username });
            if (error) {
                console.log('DRAW CARDS REJECTED', error, roomId, username);
                socket.emit('action-rejected', error);
                return;
            }
            const currentRoom = roomsList[roomId];
            const currentGame = games[roomId];

            // Setting hand with drawn cards
            currentGame.players[username].userCards.hand = [
                ...(currentGame.players[username].userCards.hand && currentGame.players[username].userCards.hand.length > 0
                    ? currentGame.players[username].userCards.hand
                    : []),
                ...(currentGame.laidCards ? currentGame.laidCards : []),
            ].sort((a, b) => a.value - b.value);

            // Setting laidCards to null (given to hand)
            currentGame.laidCards = null;

            // The next player is on (after a called player: the one after them).
            currentGame.call = null;
            setActivePlayerNext(currentGame);

            // Send new game data to sockets
            startTurnClock(io, roomId, currentGame);
            sendUiDataToSocket(io, currentRoom, currentGame, 'cards-drawn');
        });
    });
};

/**
 * `from` without one copy of each of `cards` (same value and colour). With two decks a
 * player can hold two identical cards; only as many copies as were laid are removed.
 */
export const withoutCards = (from, cards) => {
    const rest = [...from];
    for (const card of cards) {
        const i = rest.findIndex(own => own.value === card.value && own.color === card.color);
        if (i >= 0) rest.splice(i, 1);
    }
    return rest;
};

// Table cards are kept per spot, as dealt: `table[i]` (face-down) lies under `tableFlipped[i]`
// (face-up). A played card leaves its spot empty (null), so the other cards keep their spots.

/** The cards of a spot list (`table` or `tableFlipped`), without the empty spots. */
export const present = spots => (spots ?? []).filter(Boolean);

/** The spot of the `n`-th card still in `spots` (left to right), or -1. */
export const nthCardSpot = (spots, n) => {
    let seen = -1;
    return spots.findIndex(own => own && ++seen === n);
};

/** `spots` with one copy of each of `cards` taken out (its spot left empty). */
export const clearSpots = (spots, cards) => {
    const rest = [...spots];
    for (const card of cards) {
        const i = rest.findIndex(own => own && own.value === card.value && own.color === card.color);
        if (i >= 0) rest[i] = null;
    }
    return rest;
};

/**
 * What anyone may see of a player's table spots: each spot's face-up card and whether a
 * face-down card lies there. Empty spots at the end are left out.
 */
export const spotsView = userCards => {
    const spots = Array.from({ length: Math.max(userCards.table.length, userCards.tableFlipped.length) }, (_, i) => ({
        faceUp: userCards.tableFlipped[i] ?? null,
        faceDown: !!userCards.table[i],
    }));
    while (spots.length > 0 && !spots[spots.length - 1].faceUp && !spots[spots.length - 1].faceDown) spots.pop();
    return spots;
};

/** How many cards on top of `pile` (top first) have the top card's value. */
const topRun = pile => {
    let count = 0;
    while (count < pile.length && pile[count].value === pile[0].value) count++;
    return count;
};

/**
 * Lays `cards` (one or several of the same value, already validated) for `username`:
 * removes them from their hand, or from their face-up cards once the hand is empty (unless
 * `fromTable`: a revealed face-down card, already removed), refills the hand to 3 from the
 * deck, then puts them on the pile one after the other (the last one on top). A 10, or four
 * of a kind on top of the pile, burns it and the same player goes again; otherwise the turn
 * passes on: with an Ace ("Call Next") to the player `call` names (any other player; missing or
 * invalid: the next one), who must lay a magic card; with a 6 and the room's "6 reverses" rule,
 * after the direction flips (once, however many 6s).
 */
export const applyLay = (game, username, cards, cardIndex = 0, { fromTable = false, call } = {}) => {
    const userCards = game.players[username].userCards;
    if (!fromTable) {
        if (userCards.hand.length !== 0) userCards.hand = withoutCards(userCards.hand, cards);
        else userCards.tableFlipped = clearSpots(userCards.tableFlipped, cards);
    }
    // New cards go where the laid one was (the client keeps the hand in its order).
    let at = Math.max(0, Math.min(Number.isInteger(cardIndex) ? cardIndex : 0, userCards.hand.length));
    while (userCards.hand.length < 3 && game.deck.length > 0) {
        userCards.hand.splice(at++, 0, game.deck.shift());
    }

    const pile = [...[...cards].reverse(), ...(game.laidCards ?? [])];
    if (cards[0].value === 10 || topRun(pile) >= 4) {
        game.burntCards = [...pile, ...(game.burntCards ?? [])];
        game.laidCards = null;
        game.call = null;
        return;
    }
    game.laidCards = pile;
    if (game.rules?.sixReverses && isReverse(cards[0])) {
        game.direction = game.direction === -1 ? 1 : -1;
    }
    const target = isCallNext(cards[0]) && call !== username && game.players[call] ? call : undefined;
    setActivePlayerNext(game, target);
    game.call = isCallNext(cards[0]) ? { by: username, target: activeName(game) } : null;
};

/** Who is on turn in `game`. */
const activeName = game => Object.keys(game.players).find(name => game.players[name].active);

/**
 * What `username` may see of `game`: their own cards (face-down table cards only as a
 * count), opponents' card counts and face-up cards, the pile, the deck size and the turn.
 */
export const buildPlayerView = (room, game, username) => {
    const opponents = {};
    room.players.forEach(otherPlayer => {
        if (otherPlayer.username !== username) {
            const { userCards, active, ready } = game.players[otherPlayer.username];
            opponents[otherPlayer.username] = {
                table: present(userCards.table).length,
                hand: userCards.hand.length,
                tableFlipped: present(userCards.tableFlipped),
                spots: spotsView(userCards),
                active,
                ready: !!ready,
            };
        }
    });
    const own = game.players[username];
    return {
        userCards: {
            hand: own.userCards.hand,
            tableFlipped: present(own.userCards.tableFlipped),
            table: present(own.userCards.table).length,
            spots: spotsView(own.userCards),
        },
        opponents,
        laidCards: game.laidCards ? game.laidCards : null,
        burntCards: game.burntCards ? game.burntCards : null,
        deck: game.deck.length,
        active: own.active,
        phase: game.phase ?? 'play',
        ready: !!own.ready,
        blindMiss: game.blindMiss ?? null,
        direction: game.direction === -1 ? -1 : 1,
        call: game.call ?? null,
        turnTimeLeft: game.turnEndsAt ? Math.max(0, game.turnEndsAt - Date.now()) : null,
        turnTime: game.turnEndsAt ? game.turnTime : null,
    };
};

export const sendUiDataToSocket = async (io, room, game, message, roomId) => {
    room.players.forEach(player => {
        io.to(player.socketId).emit(message, buildPlayerView(room, game, player.username), roomsList, roomId);
    });
};

/** The room `username` is in, as `[roomId, room]`, or undefined. */
const findRoomOf = username => {
    const entry = Object.entries(roomsList).find(([, room]) => room.players.some(player => player.username === username));
    return entry && [Number(entry[0]), entry[1]];
};

/**
 * Full state for one client, used to re-sync after a reconnect or when the app returns to
 * the foreground: all rooms, the user's room (if any), their view of its game (if
 * started) and the room's chat history.
 */
export const buildGameState = username => {
    const found = username ? findRoomOf(username) : undefined;
    if (!found) {
        return { roomId: null, game: null, rooms: roomsList, messages: [] };
    }
    const [roomId, room] = found;
    const game = room.inGame && games[roomId] ? buildPlayerView(room, games[roomId], username) : null;
    return { roomId, game, rooms: roomsList, messages: roomMessages[`game-${roomId}`] ?? [] };
};

/**
 * Passes the turn on in `game`: to player `to` when given (an Ace's call), otherwise to the
 * next player after whoever is on turn, in the game's direction (seat order, or reversed).
 */
export const setActivePlayerNext = (game, to) => {
    const names = Object.keys(game.players);
    const from = names.findIndex(name => game.players[name].active);
    const step = game.direction === -1 ? -1 : 1;
    const next = to && game.players[to] ? to : names[(from + step + names.length) % names.length];
    names.forEach(name => {
        game.players[name].active = name === next;
    });
};

export let deck = [
    // Clubs
    { name: 'Start Over', value: 2, color: 'clubs', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'clubs' },
    { name: '4', value: 4, color: 'clubs' },
    { name: '5', value: 5, color: 'clubs' },
    { name: '6', value: 6, color: 'clubs' },
    { name: '7', value: 7, color: 'clubs' },
    { name: 'Mirror', value: 0, color: 'clubs', isMagicCard: true },
    { name: 'You lose', value: 9, color: 'clubs', isTeaseCard: true },
    { name: 'Clear all', value: 10, color: 'clubs', isMagicCard: true },
    { name: 'J', value: 11, color: 'clubs' },
    { name: 'Q', value: 12, color: 'clubs' },
    { name: 'K', value: 13, color: 'clubs' },
    { name: 'Call Next', value: 14, color: 'clubs', isMagicCard: true },
    // Diamonds
    { name: 'Start Over', value: 2, color: 'diamonds', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'diamonds' },
    { name: '4', value: 4, color: 'diamonds' },
    { name: '5', value: 5, color: 'diamonds' },
    { name: '6', value: 6, color: 'diamonds' },
    { name: '7', value: 7, color: 'diamonds' },
    { name: 'Mirror', value: 0, color: 'diamonds', isMagicCard: true },
    { name: 'You lose', value: 9, color: 'diamonds', isTeaseCard: true },
    { name: 'Clear all', value: 10, color: 'diamonds', isMagicCard: true },
    { name: 'J', value: 11, color: 'diamonds' },
    { name: 'Q', value: 12, color: 'diamonds' },
    { name: 'K', value: 13, color: 'diamonds' },
    { name: 'Call Next', value: 14, color: 'diamonds', isMagicCard: true },
    // Hearts
    { name: 'Start Over', value: 2, color: 'hearts', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'hearts' },
    { name: '4', value: 4, color: 'hearts' },
    { name: '5', value: 5, color: 'hearts' },
    { name: '6', value: 6, color: 'hearts' },
    { name: '7', value: 7, color: 'hearts' },
    { name: 'Mirror', value: 0, color: 'hearts', isMagicCard: true },
    { name: 'You lose', value: 9, color: 'hearts', isTeaseCard: true },
    { name: 'Clear all', value: 10, color: 'hearts', isMagicCard: true },
    { name: 'J', value: 11, color: 'hearts' },
    { name: 'Q', value: 12, color: 'hearts' },
    { name: 'K', value: 13, color: 'hearts' },
    { name: 'Call Next', value: 14, color: 'hearts', isMagicCard: true },
    // Spades
    { name: 'Start Over', value: 2, color: 'spades', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'spades' },
    { name: '4', value: 4, color: 'spades' },
    { name: '5', value: 5, color: 'spades' },
    { name: '6', value: 6, color: 'spades' },
    { name: '7', value: 7, color: 'spades' },
    { name: 'Mirror', value: 0, color: 'spades', isMagicCard: true },
    { name: 'You lose', value: 9, color: 'spades', isTeaseCard: true },
    { name: 'Clear all', value: 10, color: 'spades', isMagicCard: true },
    { name: 'J', value: 11, color: 'spades' },
    { name: 'Q', value: 12, color: 'spades' },
    { name: 'K', value: 13, color: 'spades' },
    { name: 'Call Next', value: 14, color: 'spades', isMagicCard: true },
];

export const shuffleDeck = deck => [...deck].sort(() => Math.random() - 0.5);

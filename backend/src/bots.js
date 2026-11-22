// Bots: seats a room's owner can fill when there aren't enough friends around. A bot is a room
// player `{ username, socketId: null, avatar, bot: true }`; it has no socket. On its turn the
// server makes its move after a moment's "thinking", through the same checks and code as a
// player's (`checkCards`, `performLay`, `performDraw`), so a bot can never break a rule. Games
// with a bot are practice: never recorded (see `performLay`).

import { AVATAR_IDS, canLayCard, isCallNext } from '@dutch-pub/shared';

import { activeName, checkCards, combinesWithFaceUp, markReady, performDraw, performLay, present, sendUiDataToSocket, startTurnClock, swapCards } from './game.js';
import { games, roomsList } from './rooms.js';

/** The bots' names (the robot keeps them apart from real names, which can't contain emoji). */
export const BOT_NAMES = [
    '🤖 Sir Bluffalot',
    '🤖 Count Cardula',
    '🤖 Lady Luck',
    '🤖 Captain Shuffle',
    '🤖 Dizzy Dealer',
    '🤖 Professor Pip',
    '🤖 Wild Card Willy',
    '🤖 Queen Bee',
];

/** At most this many bots in a room (with 4 seats there is always one human). */
export const MAX_BOTS = 3;

/** How long a bot "thinks" before a move (ms), so the game feels played, not instant. Env for tests. */
const THINK_MIN_MS = Number(process.env.BOT_THINK_MIN_MS ?? 900);
const THINK_MAX_MS = Number(process.env.BOT_THINK_MAX_MS ?? 1800);
const thinkTime = () => THINK_MIN_MS + Math.random() * Math.max(0, THINK_MAX_MS - THINK_MIN_MS);

export const isBot = (room, username) => !!room?.players.some(player => player.username === username && player.bot);

/** A new bot for `room`: a name not used in it yet, a random avatar. */
export const newBot = room => {
    const taken = new Set(room.players.map(player => player.username));
    const free = BOT_NAMES.filter(name => !taken.has(name));
    const username = free[Math.floor(Math.random() * free.length)];
    return { username, socketId: null, avatar: AVATAR_IDS[Math.floor(Math.random() * AVATAR_IDS.length)], bot: true };
};

/** How much a card is worth keeping: magic cards most, then by value. */
const strength = card => (card.isMagicCard ? 100 : 0) + card.value;

/**
 * Swap phase: the bot puts its strongest cards face up (they are played late, when they help
 * most) by swapping with its hand, then it is ready. A moment later, like a player.
 */
export const readyBots = (io, roomId, game) => {
    const room = roomsList[roomId];
    if (!room || game.phase !== 'swap') return;
    room.players
        .filter(player => player.bot && !game.players[player.username]?.ready)
        .forEach(bot => {
            setTimeout(() => {
                if (games[roomId] !== game || game.phase !== 'swap') return;
                arrangeFaceUp(game, bot.username);
                if (markReady(game, bot.username)) startTurnClock(io, roomId, game);
                sendUiDataToSocket(io, roomsList[roomId], game, 'game-updated');
            }, thinkTime());
        });
};

/** Swaps hand cards stronger than face-up ones until the face-up cards are the strongest. */
export const arrangeFaceUp = (game, username) => {
    const cards = game.players[username].userCards;
    for (let i = 0; i < 3; i++) {
        const weakestUp = present(cards.tableFlipped).reduce((weakest, card) => (!weakest || strength(card) < strength(weakest) ? card : weakest), null);
        const strongestHand = cards.hand.reduce((strongest, card) => (!strongest || strength(card) > strength(strongest) ? card : strongest), null);
        if (!weakestUp || !strongestHand || strength(strongestHand) <= strength(weakestUp)) return;
        if (swapCards(game, username, strongestHand, weakestUp)) return;
    }
};

/** The opponent with the fewest cards left (the one to stop): whom a bot's Ace calls. */
const leader = (game, username) =>
    Object.entries(game.players)
        .filter(([name]) => name !== username)
        .map(([name, player]) => [name, player.userCards.hand.length + present(player.userCards.tableFlipped).length + present(player.userCards.table).length])
        .sort((a, b) => a[1] - b[1])[0]?.[0];

/**
 * The bot's move: from its hand while it has cards, then its face-up cards (the lowest card that
 * fits, all its copies together; magic cards kept for when nothing else fits), then a face-down
 * card blind. `{ draw: true }` when nothing fits. An Ace calls the opponent closest to winning.
 */
export const botMove = (game, username) => {
    const { hand, tableFlipped, table } = game.players[username].userCards;
    const faceUp = present(tableFlipped);
    const pool = hand.length > 0 ? hand : faceUp;
    if (pool.length === 0) {
        // Blind: the first face-down card still there.
        const spot = table.findIndex(Boolean);
        return { card: 0, cardIndex: Math.max(0, spot) };
    }
    const playable = pool.filter(card => canLayCard(card, game.laidCards, game.rules));
    if (playable.length === 0) return { draw: true };
    const choice = [...playable].sort((a, b) => Number(!!a.isMagicCard) - Number(!!b.isMagicCard) || a.value - b.value)[0];
    // All copies of that value; with the deck gone and a hand of only that value, face-up copies too.
    const copies = [...pool.filter(card => card.value === choice.value), ...(hand.length > 0 && combinesWithFaceUp(game, hand) ? faceUp.filter(card => card.value === choice.value) : [])];
    const call = isCallNext(choice) ? leader(game, username) : undefined;
    const cardIndex = hand.length > 0 ? hand.indexOf(choice) : tableFlipped.indexOf(choice);
    return copies.length > 1 ? { cards: copies, cardIndex, call } : { card: choice, cardIndex, call };
};

/**
 * Called whenever a turn starts (`startTurnClock`): if a bot is on turn, it moves after a
 * moment, if it is still its turn then (nothing changed meanwhile, e.g. the game was stopped).
 */
export const scheduleBotTurn = (io, roomId, game) => {
    const room = roomsList[roomId];
    if (!room || games[roomId] !== game || game.phase === 'swap' || game.blindMiss) return;
    const username = activeName(game);
    if (!isBot(room, username)) return;
    setTimeout(async () => {
        if (games[roomId] !== game || game.phase === 'swap' || game.blindMiss || activeName(game) !== username) return;
        try {
            const move = botMove(game, username);
            const validation = move.draw ? { error: 'draw' } : checkCards(game, game.players[username], move);
            if (validation.error) performDraw(io, roomId, username);
            else await performLay(io, roomId, username, validation, { cardIndex: move.cardIndex, call: move.call });
        } catch (error) {
            console.log('BOT MOVE FAILED', error.message);
        }
    }, thinkTime()).unref?.();
};

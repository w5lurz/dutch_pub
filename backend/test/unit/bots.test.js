import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { arrangeFaceUp, botMove, BOT_NAMES, newBot } from '../../src/bots.js';

const card = (value, color = 'hearts', extra = {}) => ({ name: String(value), value, color, ...extra });
const magic = (value, name) => card(value, 'spades', { name, isMagicCard: true });

const gameWith = (userCards, { laidCards = null, others = { anna: 5 } } = {}) => ({
    players: {
        bot: { userCards: { hand: [], tableFlipped: [], table: [], ...userCards }, active: true },
        ...Object.fromEntries(
            Object.entries(others).map(([name, count]) => [name, { userCards: { hand: Array.from({ length: count }, (_, i) => card(3 + (i % 5))), tableFlipped: [], table: [] }, active: false }]),
        ),
    },
    laidCards,
    deck: [],
    rules: { nineOnMagic: true, sixReverses: false },
    phase: 'play',
});

describe('bot moves', () => {
    test('the lowest card that fits, magic cards kept for later', () => {
        const game = gameWith({ hand: [card(13), magic(10, 'Clear all'), card(5), card(7)] }, { laidCards: [card(4)] });
        assert.deepEqual(botMove(game, 'bot'), { card: card(5), cardIndex: 2, call: undefined });
    });

    test('all copies of the value together', () => {
        const game = gameWith({ hand: [card(6), card(6, 'clubs'), card(12)] }, { laidCards: [card(3)] });
        const move = botMove(game, 'bot');
        assert.deepEqual(move.cards.map(c => c.color).sort(), ['clubs', 'hearts']);
    });

    test('a magic card when nothing else fits; picks up when nothing fits at all', () => {
        assert.equal(botMove(gameWith({ hand: [card(5), magic(2, 'Start Over')] }, { laidCards: [card(13)] }), 'bot').card.value, 2);
        assert.deepEqual(botMove(gameWith({ hand: [card(5), card(6)] }, { laidCards: [card(13)] }), 'bot'), { draw: true });
    });

    test('face-up cards after the hand, then a face-down card blind', () => {
        const faceUp = gameWith({ hand: [], tableFlipped: [null, card(9), card(8)] }, { laidCards: [card(7)] });
        assert.deepEqual(botMove(faceUp, 'bot'), { card: card(8), cardIndex: 2, call: undefined });
        const blind = gameWith({ hand: [], tableFlipped: [null, null, null], table: [null, card(4), card(9)] });
        assert.deepEqual(botMove(blind, 'bot'), { card: 0, cardIndex: 1 });
    });

    test('an Ace calls the opponent closest to winning', () => {
        const game = gameWith({ hand: [magic(14, 'Call Next')] }, { others: { anna: 6, bela: 2, cili: 4 } });
        assert.equal(botMove(game, 'bot').call, 'bela');
    });
});

describe('bots in the swap phase', () => {
    test('put their strongest cards face up', () => {
        const game = gameWith({ hand: [magic(10, 'Clear all'), card(13), card(3)], tableFlipped: [card(4), card(5), card(12)] });
        game.phase = 'swap';
        arrangeFaceUp(game, 'bot');
        const up = game.players.bot.userCards.tableFlipped.map(c => c.value).sort((a, b) => a - b);
        assert.deepEqual(up, [10, 12, 13]);
        assert.deepEqual(game.players.bot.userCards.hand.map(c => c.value).sort((a, b) => a - b), [3, 4, 5]);
    });
});

describe('new bots', () => {
    test('get a name not taken in the room, and no socket', () => {
        const room = { players: [{ username: 'anna' }, { username: BOT_NAMES[0], bot: true }] };
        const bot = newBot(room);
        assert.ok(BOT_NAMES.includes(bot.username));
        assert.notEqual(bot.username, BOT_NAMES[0]);
        assert.equal(bot.socketId, null);
        assert.equal(bot.bot, true);
    });
});

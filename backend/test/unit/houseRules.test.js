import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ROOM_SETTINGS } from '@dutch-pub/shared';

import { applyLay, buildPlayerView, setActivePlayerNext, timeOutTurn, validateLayCard } from '../../src/game.js';
import { deckCount, games, modifyRooms, roomsList } from '../../src/rooms.js';

const card = (value, color = 'clubs', extra = {}) => ({ name: String(value), value, color, ...extra });
const ace = (color = 'clubs') => card(14, color, { name: 'Call Next', isMagicCard: true });
const startOver = card(2, 'clubs', { name: 'Start Over', isMagicCard: true });
const nine = card(9, 'clubs', { name: 'You lose', isTeaseCard: true });
const ROOM_ID = 3;
const socketA = { id: 'socket-a', data: { user: { id: 1, username: 'a', isGuest: false } } };

/** Four players a, b, c, d (seat order); "a" is on turn with `hand`. */
const setUp = ({ hand = [card(5)], laid = [card(4, 'hearts')], rules = {}, direction = 1 } = {}) => {
    modifyRooms({
        [ROOM_ID]: {
            name: 'rules room',
            owner: 'a',
            players: ['a', 'b', 'c', 'd'].map(username => ({ username, socketId: `socket-${username}` })),
            slots: 4,
            visibility: 'public',
            inGame: true,
        },
    });
    const cards = () => ({ hand: [card(3, 'spades')], tableFlipped: [], table: [] });
    const game = {
        laidCards: laid,
        burntCards: null,
        deck: [],
        phase: 'play',
        rules,
        direction,
        players: {
            a: { active: true, userCards: { hand, tableFlipped: [], table: [] } },
            b: { active: false, userCards: cards() },
            c: { active: false, userCards: cards() },
            d: { active: false, userCards: cards() },
        },
    };
    games[ROOM_ID] = game;
    return game;
};

const onTurn = game => Object.keys(game.players).find(name => game.players[name].active);

describe('turn order', () => {
    test('passes clockwise (seat order), wrapping around', () => {
        const game = setUp();
        setActivePlayerNext(game);
        assert.equal(onTurn(game), 'b');
        game.players.b.active = false;
        game.players.d.active = true;
        setActivePlayerNext(game);
        assert.equal(onTurn(game), 'a');
    });

    test('reversed: the other way round', () => {
        const game = setUp({ direction: -1 });
        setActivePlayerNext(game);
        assert.equal(onTurn(game), 'd');
    });
});

describe('Ace ("Call Next") calls a player', () => {
    test('the called player is on next, and the view shows the call', () => {
        const game = setUp({ hand: [ace(), card(5)] });
        applyLay(game, 'a', [ace()], 0, { call: 'c' });
        assert.equal(onTurn(game), 'c');
        assert.deepEqual(game.call, { by: 'a', target: 'c' });
        assert.deepEqual(buildPlayerView(roomsList[ROOM_ID], game, 'b').call, { by: 'a', target: 'c' });
    });

    test('after the called player, play goes on from them (the turn jumped)', () => {
        const game = setUp({ hand: [ace(), card(5)] });
        applyLay(game, 'a', [ace()], 0, { call: 'c' });
        game.players.c.userCards.hand = [startOver, card(8)];
        applyLay(game, 'c', [startOver], 0);
        assert.equal(onTurn(game), 'd');
        assert.equal(game.call, null, 'the call is over');
    });

    test('no call, an unknown player, yourself or a built-in property name: the next player', () => {
        // A built-in name like __proto__ once "found" a player and left nobody on turn (the game froze).
        for (const call of [undefined, 'zed', 'a', '__proto__', 'constructor', 'toString', { evil: true }]) {
            const game = setUp({ hand: [ace(), card(5)] });
            applyLay(game, 'a', [ace()], 0, { call });
            assert.equal(onTurn(game), 'b', `call: ${call}`);
            assert.deepEqual(game.call, { by: 'a', target: 'b' });
        }
    });

    test('a call only counts with an Ace', () => {
        const game = setUp({ hand: [card(7), card(5)] });
        applyLay(game, 'a', [card(7)], 0, { call: 'c' });
        assert.equal(onTurn(game), 'b');
        assert.equal(game.call, null);
    });

    test('the called player must lay a magic card', () => {
        const game = setUp({ hand: [ace(), card(5)] });
        applyLay(game, 'a', [ace()], 0, { call: 'c' });
        assert.equal(game.laidCards[0].value, 14);
        game.players.c.userCards.hand = [card(13), startOver];
        const socketC = { id: 'socket-c', data: { user: { id: 3, username: 'c', isGuest: false } } };
        assert.equal(validateLayCard(socketC, { card: card(13), cardIndex: 0, roomId: ROOM_ID, username: 'c' }).error, 'You cannot lay that card.');
        assert.ok(validateLayCard(socketC, { card: startOver, cardIndex: 1, roomId: ROOM_ID, username: 'c' }).card);
    });

    test('four Aces burn the pile: the same player again, no call', () => {
        const game = setUp({ hand: [ace('hearts'), card(5)], laid: [ace('spades'), ace('diamonds'), ace('clubs')] });
        applyLay(game, 'a', [ace('hearts')], 0, { call: 'c' });
        assert.equal(game.laidCards, null);
        assert.equal(onTurn(game), 'a');
        assert.equal(game.call, null);
    });

    test('a skipped turn (timer) ends the call', () => {
        const game = setUp({ hand: [ace(), card(5)] });
        applyLay(game, 'a', [ace()], 0, { call: 'c' });
        timeOutTurn(game);
        assert.equal(onTurn(game), 'd');
        assert.equal(game.call, null);
    });
});

describe('house rule "6 reverses"', () => {
    test('off (default): a 6 is a normal card', () => {
        const game = setUp({ hand: [card(6), card(8)] });
        applyLay(game, 'a', [card(6)], 0);
        assert.equal(onTurn(game), 'b');
        assert.equal(game.direction, 1);
    });

    test('on: a 6 flips the direction; the turn goes the other way', () => {
        const game = setUp({ hand: [card(6), card(8)], rules: { sixReverses: true } });
        applyLay(game, 'a', [card(6)], 0);
        assert.equal(game.direction, -1);
        assert.equal(onTurn(game), 'd');
        assert.equal(buildPlayerView(roomsList[ROOM_ID], game, 'a').direction, -1);
    });

    test('several 6s at once flip it once', () => {
        const game = setUp({ hand: [card(6), card(6, 'hearts'), card(6, 'spades'), card(8)], rules: { sixReverses: true } });
        applyLay(game, 'a', [card(6), card(6, 'hearts'), card(6, 'spades')], 0);
        assert.equal(game.direction, -1);
        assert.equal(onTurn(game), 'd');
    });

    test('a second 6 flips it back', () => {
        const game = setUp({ hand: [card(6), card(8)], rules: { sixReverses: true }, direction: -1 });
        applyLay(game, 'a', [card(6)], 0);
        assert.equal(game.direction, 1);
        assert.equal(onTurn(game), 'b');
    });
});

describe('house rule "9 on a magic card"', () => {
    test('on (default): a 9 may go on a Start Over', () => {
        setUp({ hand: [nine, card(5)], laid: [startOver] });
        assert.ok(validateLayCard(socketA, { card: nine, cardIndex: 0, roomId: ROOM_ID, username: 'a' }).card);
    });

    test('off: refused on a magic card', () => {
        setUp({ hand: [nine, card(5)], laid: [startOver], rules: { nineOnMagic: false } });
        assert.equal(validateLayCard(socketA, { card: nine, cardIndex: 0, roomId: ROOM_ID, username: 'a' }).error, 'You cannot lay that card.');
    });
});

describe('number of decks', () => {
    test('auto: 2 decks with 4 players, else 1; or the room’s choice', () => {
        const auto = { ...DEFAULT_ROOM_SETTINGS };
        assert.equal(deckCount(auto, 2), 1);
        assert.equal(deckCount(auto, 3), 1);
        assert.equal(deckCount(auto, 4), 2);
        assert.equal(deckCount({ ...auto, decks: 2 }, 2), 2);
        assert.equal(deckCount({ ...auto, decks: 1 }, 4), 1);
    });
});

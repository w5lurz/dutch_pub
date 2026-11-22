import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { botMove } from '../../src/bots.js';
import { applyLay, checkCards } from '../../src/game.js';

const card = (value, color) => ({ name: String(value), value, color, ...(value === 2 && { isMagicCard: true, name: 'Start Over' }) });

const setup = ({ hand, tableFlipped, deck = [] }) => {
    const game = {
        players: {
            me: { userCards: { hand, tableFlipped, table: [card(9, 'clubs')] }, active: true },
            anna: { userCards: { hand: [card(5, 'hearts')], tableFlipped: [], table: [] }, active: false },
        },
        laidCards: [card(4, 'hearts')],
        deck,
        rules: { nineOnMagic: true, sixReverses: false },
        phase: 'play',
        direction: 1,
    };
    return { game, player: game.players.me };
};

describe('face-up cards laid together with the whole hand', () => {
    test('allowed once the deck is gone and the whole hand (one value) goes with them', () => {
        const { game, player } = setup({ hand: [card(2, 'hearts'), card(2, 'clubs')], tableFlipped: [card(2, 'spades'), card(7, 'hearts'), null] });
        const checked = checkCards(game, player, { cards: [card(2, 'hearts'), card(2, 'clubs'), card(2, 'spades')] });
        assert.equal(checked.error, undefined);
        applyLay(game, 'me', checked.cards, 0);
        assert.deepEqual(player.userCards.hand, []);
        assert.deepEqual(player.userCards.tableFlipped, [null, card(7, 'hearts'), null], 'the face-up 2 left its spot; the others stay');
        assert.equal(game.laidCards.length, 4);
    });

    test('not while the deck has cards (the hand would be refilled)', () => {
        const { game, player } = setup({ hand: [card(2, 'hearts')], tableFlipped: [card(2, 'spades')], deck: [card(11, 'hearts')] });
        assert.equal(checkCards(game, player, { cards: [card(2, 'hearts'), card(2, 'spades')] }).error, "You don't have that card.");
    });

    test('not with only part of the hand', () => {
        const { game, player } = setup({ hand: [card(2, 'hearts'), card(2, 'clubs')], tableFlipped: [card(2, 'spades')] });
        assert.equal(checkCards(game, player, { cards: [card(2, 'hearts'), card(2, 'spades')] }).error, 'Face-up cards can only join your whole hand.');
    });

    test('not with a hand of mixed values', () => {
        const { game, player } = setup({ hand: [card(2, 'hearts'), card(6, 'clubs')], tableFlipped: [card(2, 'spades')] });
        assert.equal(checkCards(game, player, { cards: [card(2, 'hearts'), card(2, 'spades')] }).error, "You don't have that card.");
    });

    test('bots do it too', () => {
        const { game } = setup({ hand: [card(6, 'hearts')], tableFlipped: [card(6, 'spades'), card(12, 'hearts'), null] });
        assert.deepEqual(
            botMove(game, 'me').cards.map(c => c.color),
            ['hearts', 'spades'],
        );
    });
});

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { buildLeaderBoard } from '../../src/controllers/played_game.controller.js';

const game = (winner, players, date) => ({ winner, players: players.join(','), game_date: date });

describe('buildLeaderBoard', () => {
    test('a favourite friend comes only from the games the player played in', () => {
        const board = buildLeaderBoard([
            game('anna', ['anna', 'bela'], '2026-11-01'),
            // Games anna did not play in must not count for her.
            game('cili', ['cili', 'dani'], '2026-11-02'),
            game('cili', ['cili', 'dani'], '2026-11-03'),
            game('dani', ['dani', 'cili', 'bela'], '2026-11-04'),
        ]);
        const byName = Object.fromEntries(board.map(entry => [entry.winner, entry]));
        assert.equal(byName.anna.favouriteFriend, 'bela');
        assert.equal(byName.cili.favouriteFriend, 'dani');
        assert.equal(byName.dani.favouriteFriend, 'cili');
    });

    test('ranks by wins, with the latest win date', () => {
        const board = buildLeaderBoard([
            game('cili', ['cili', 'dani'], '2026-11-03'),
            game('anna', ['anna', 'bela'], '2026-11-01'),
            game('cili', ['cili', 'dani'], '2026-11-02'),
        ]);
        assert.deepEqual(
            board.map(({ winner, wins, rank, latestWin }) => ({ winner, wins, rank, latestWin })),
            [
                { winner: 'cili', wins: 2, rank: 1, latestWin: '2026-11-03' },
                { winner: 'anna', wins: 1, rank: 2, latestWin: '2026-11-01' },
            ],
        );
    });

    test('a player who only played alone has no favourite friend', () => {
        assert.equal(buildLeaderBoard([game('anna', ['anna'], '2026-11-01')])[0].favouriteFriend, undefined);
    });
});

import { describe, test, mock } from 'node:test';
import assert from 'node:assert/strict';

import { endStreaks, startStreaks } from '../../src/streaks.js';

describe('games in a row (streaks)', () => {
    test('counts games that start within 30 minutes of the previous one, per player', () => {
        mock.timers.enable({ apis: ['Date'], now: 1_000_000_000 });
        try {
            assert.equal(startStreaks(['s_anna', 's_bela']), 1);
            endStreaks(['s_anna', 's_bela']);
            mock.timers.tick(10 * 60 * 1000);
            assert.equal(startStreaks(['s_anna', 's_bela']), 2);
            endStreaks(['s_anna', 's_bela']);
            mock.timers.tick(29 * 60 * 1000);
            // A newcomer doesn't lower the table's count: it is the most of anyone there.
            assert.equal(startStreaks(['s_anna', 's_cili']), 3);
            endStreaks(['s_anna', 's_cili']);
            mock.timers.tick(31 * 60 * 1000);
            assert.equal(startStreaks(['s_anna']), 1, 'more than 30 minutes later: from one again');
        } finally {
            mock.timers.reset();
        }
    });

    test('a game the player left without an end counts as over after 2 hours', () => {
        mock.timers.enable({ apis: ['Date'], now: 2_000_000_000 });
        try {
            startStreaks(['s_dora']);
            mock.timers.tick(60 * 60 * 1000);
            assert.equal(startStreaks(['s_dora']), 2, 'within 2 h 30 min of the start');
            mock.timers.tick(3 * 60 * 60 * 1000);
            assert.equal(startStreaks(['s_dora']), 1);
        } finally {
            mock.timers.reset();
        }
    });
});

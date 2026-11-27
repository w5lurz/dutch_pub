import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { turnMessage } from '../../src/push.js';
import { languageOf, languageOfHeader, missingTexts, text } from '../../src/texts.js';

describe("the server's texts", () => {
    test('every language has every text', () => {
        assert.deepEqual(missingTexts(), []);
    });

    test('languages: known codes, else English', () => {
        assert.equal(languageOf('hu'), 'hu');
        assert.equal(languageOf('de-AT'), 'de');
        assert.equal(languageOf('es'), 'en');
        assert.equal(languageOf(undefined), 'en');
        assert.equal(languageOf({ toString: () => 'hu' }), 'en');
    });

    test("a browser's Accept-Language picks the best known language", () => {
        assert.equal(languageOfHeader('es-ES,es;q=0.9,fr;q=0.8,en;q=0.7'), 'fr');
        assert.equal(languageOfHeader('zh-CN,zh;q=0.9'), 'zh');
        assert.equal(languageOfHeader('en;q=0.5, uk'), 'uk');
        assert.equal(languageOfHeader('ja'), 'en');
        assert.equal(languageOfHeader(undefined), 'en');
    });

    test('placeholders are filled in; English when a language is unknown', () => {
        assert.equal(text('hu', 'pushCalledYou', { name: 'Anna' }), 'Anna téged hívott!');
        assert.equal(text('xx', 'pushYourTurn'), 'Your turn');
    });

    test('a notification in the phone language', () => {
        const room = { name: 'Pub' };
        assert.deepEqual(turnMessage(room, { call: null }, 'a', 'de'), { title: 'Du bist dran', body: 'Leg eine Karte in Pub.' });
        assert.deepEqual(turnMessage(room, { call: { by: 'b', target: 'a' } }, 'a', 'uk'), {
            title: 'b викликав тебе!',
            body: 'Поклади магічну карту або забери стос (Pub).',
        });
    });
});

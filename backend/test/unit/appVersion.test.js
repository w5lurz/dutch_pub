import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { compareVersions, isOutdated, minAppVersion, requireAppVersion } from '../../src/appVersion.js';

describe('minimum app version', () => {
    afterEach(() => delete process.env.MIN_APP_VERSION);

    test('versions compare part by part, missing parts count as 0', () => {
        assert.ok(compareVersions('1.2.0', '1.10.0') < 0);
        assert.ok(compareVersions('2.0.0', '1.99.99') > 0);
        assert.equal(compareVersions('1.2', '1.2.0'), 0);
    });

    test('no minimum set: every app may connect, even without a version', () => {
        assert.equal(minAppVersion(), null);
        assert.equal(isOutdated(undefined), false);
        assert.equal(isOutdated('0.1.0'), false);
    });

    test('with a minimum: older, missing and garbled versions must update', () => {
        process.env.MIN_APP_VERSION = '1.1.0';
        assert.equal(isOutdated('1.0.9'), true);
        assert.equal(isOutdated(undefined), true);
        assert.equal(isOutdated('latest'), true);
        assert.equal(isOutdated({ toString: () => '9.9.9' }), true);
        assert.equal(isOutdated('1.1.0'), false);
        assert.equal(isOutdated('1.2.0'), false);
    });

    test('a minimum that is not a version turns the check off', () => {
        process.env.MIN_APP_VERSION = 'one';
        const log = console.error;
        console.error = () => {};
        try {
            assert.equal(minAppVersion(), null);
            assert.equal(isOutdated(undefined), false);
        } finally {
            console.error = log;
        }
    });

    test('the API answers outdated apps with 426, the health check stays open', () => {
        process.env.MIN_APP_VERSION = '1.1.0';
        const run = (path, version) => {
            let sent = null;
            let passed = false;
            const req = { path, get: name => (name === 'X-App-Version' ? version : undefined) };
            const res = { status: code => ({ send: body => (sent = { code, body }) }) };
            requireAppVersion(req, res, () => (passed = true));
            return { sent, passed };
        };
        const old = run('/auth/login', '1.0.0');
        assert.equal(old.passed, false);
        assert.equal(old.sent.code, 426);
        assert.equal(old.sent.body.code, 'UPDATE_REQUIRED');
        assert.equal(run('/auth/login', '1.1.0').passed, true);
        assert.equal(run('/health', undefined).passed, true);
    });
});

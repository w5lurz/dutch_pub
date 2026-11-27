import { describe, expect, it } from 'vitest';

import { emailError, passwordError, usernameError } from './validation';

describe('usernameError', () => {
    it('accepts ordinary names, accents and inner spaces', () => {
        for (const name of ['Tamás', 'Julcsi', 'jo', 'Kis Pista', 'e2e_guest_1', 'a.b-c', '  Lacika  ']) {
            expect(usernameError(name)).toBeNull();
        }
    });

    it('refuses empty, too short or long, odd characters and edges', () => {
        for (const name of ['', '   ', 'a', 'x'.repeat(21), 'a,b', '[deleted]', '_x', 'x_', 'a  b', '<b>', 'a\nb', 42, null]) {
            expect(usernameError(name)).not.toBeNull();
        }
    });

    it('refuses names of built-in object properties', () => {
        for (const name of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf']) {
            expect(usernameError(name)).not.toBeNull();
        }
    });
});

describe('emailError and passwordError', () => {
    it('emails', () => {
        expect(emailError('a@b.hu')).toBeNull();
        expect(emailError('nope')).not.toBeNull();
        expect(emailError(`${'a'.repeat(250)}@b.hu`)).not.toBeNull();
    });

    it('passwords: 8 characters to 72 bytes', () => {
        expect(passwordError('12345678')).toBeNull();
        expect(passwordError('1234567')).not.toBeNull();
        expect(passwordError('é'.repeat(37))).not.toBeNull();
        expect(passwordError(undefined)).not.toBeNull();
    });
});

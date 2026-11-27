import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { parseAvatarUpdate } from '../../src/avatars.js';
import { applyAvatarChange, modifyRooms, roomsList } from '../../src/rooms.js';

describe('parseAvatarUpdate', () => {
    test('accepts a preset id', () => {
        assert.deepEqual(parseAvatarUpdate({ avatar: 'fox' }), { avatar: 'fox' });
    });

    test('accepts null (back to the generated avatar)', () => {
        assert.deepEqual(parseAvatarUpdate({ avatar: null }), { avatar: null });
    });

    for (const body of [undefined, null, {}, { avatar: 'unicorn' }, { avatar: '' }, { avatar: 3 }, { avatar: ['fox'] }, { avatar: 'constructor' }]) {
        test(`rejects ${JSON.stringify(body)}`, () => {
            assert.ok(parseAvatarUpdate(body).error);
        });
    }
});

/** A stand-in for the socket.io server: its sockets and what it broadcast. */
const fakeIo = sockets => {
    const emitted = [];
    return {
        emitted,
        of: () => ({ sockets: new Map(sockets.map(socket => [socket.id, socket])) }),
        emit: (...args) => emitted.push(args),
    };
};

describe('applyAvatarChange', () => {
    let alice;
    let guest;
    beforeEach(() => {
        alice = { id: 's1', data: { user: { id: 7, username: 'alice', isGuest: false, avatar: null } } };
        guest = { id: 's2', data: { user: { id: 7, username: 'g', isGuest: true, avatar: null } } };
        modifyRooms({
            1: { name: 'r1', owner: 'alice', players: [{ username: 'alice', socketId: 's1', avatar: null }, { username: 'g', socketId: 's2', avatar: null }] },
            2: { name: 'r2', owner: 'bob', players: [{ username: 'bob', socketId: 's3', avatar: 'owl' }] },
        });
    });

    test("updates the user's room entry and sockets and broadcasts the rooms", () => {
        const io = fakeIo([alice, guest]);
        assert.equal(applyAvatarChange(7, 'alice', 'cat', io), true);
        assert.deepEqual(roomsList[1].players.map(player => player.avatar), ['cat', null]);
        assert.equal(roomsList[2].players[0].avatar, 'owl');
        assert.equal(alice.data.user.avatar, 'cat');
        assert.equal(guest.data.user.avatar, null, 'a guest with the same numeric id is someone else');
        assert.deepEqual(io.emitted, [['rooms-listed', roomsList]]);
    });

    test('does not broadcast when the user is in no room', () => {
        const io = fakeIo([alice]);
        assert.equal(applyAvatarChange(9, 'carol', 'cat', io), false);
        assert.deepEqual(io.emitted, []);
    });
});

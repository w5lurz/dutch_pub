import { normalizeRoomSettings } from '@dutch-pub/shared';

import { modifyRoomMessages, roomMessages } from './chat.js';
import { clearTurnClock, deck as initialDeck, sendUiDataToSocket, shuffleDeck } from './game.js';
import { identityError } from './socketAuth.js';

/** Emits `action-rejected` and returns true when `error` is set. */
const rejected = (socket, error) => {
    if (!error) return false;
    socket.emit('action-rejected', error);
    return true;
};

/** Error when `roomId` doesn't exist, or (with `ownerOnly`) the socket's user doesn't own it. */
const roomError = (socket, roomId, { ownerOnly = false } = {}) => {
    const room = roomsList[roomId];
    if (!room) return 'This room does not exist.';
    if (ownerOnly && room.owner !== socket.data.user.username) return 'Only the room owner can do that.';
    return null;
};

/**
 * Checks an `update-room-settings` request: the socket's user must own room `roomId` and
 * the game must not have started. Returns `{ error }` or `{ settings, visibility }` (the
 * room's current settings with the valid values of `settings` applied, unknown keys dropped;
 * `visibility` if it is 'public' or 'private', else the room's current one).
 */
const ROOM_VISIBILITIES = ['public', 'private'];

export const validateRoomSettingsUpdate = (socket, payload) => {
    const { roomId, settings, visibility } = payload ?? {};
    const error = identityError(socket) ?? roomError(socket, roomId, { ownerOnly: true });
    if (error) return { error };
    const room = roomsList[roomId];
    if (room.inGame) return { error: 'Settings cannot be changed after the game has started.' };
    return {
        settings: normalizeRoomSettings(settings, normalizeRoomSettings(room.settings)),
        visibility: ROOM_VISIBILITIES.includes(visibility) ? visibility : room.visibility,
    };
};

/**
 * Checks a `stop-game` request: the socket's user must own room `roomId` and its game must
 * be running. Returns the error message, or null.
 */
export const stopGameError = (socket, roomId) => {
    const error = identityError(socket) ?? roomError(socket, roomId, { ownerOnly: true });
    if (error) return error;
    if (!roomsList[roomId].inGame || !games[roomId]) return 'The game has not started.';
    return null;
};

/**
 * Ends the game of room `roomId` without a winner (the owner stopped it): the game, the room
 * and its chat are removed, as after a win, but nothing is recorded for the leaderboard.
 * Returns the room list without the room.
 */
export const stopGame = roomId => {
    if (games[roomId]) clearTurnClock(games[roomId]);
    delete games[roomId];
    const { [roomId]: _stopped, ...rest } = roomsList;
    roomsList = rest;
    const { [`game-${roomId}`]: _messages, ...restMessages } = roomMessages;
    modifyRoomMessages(restMessages);
    return roomsList;
};

export let games = {};

export let roomsList = {};
/* export let roomsList = {
    1: {
        name: 'First Room',
        owner: 'kiskutya',
        players: [
            { username: 'kiskutya', socketId: 'test1' },
            { username: 'kiscica', socketId: 'test2' },
            { username: 'hehe', socketId: 'test3' },
        ],
        slots: 4,
        visibility: 'private',
        socketRoomId: 'game-1',
    },
    2: {
        name: 'Second Room',
        owner: 'kutyi',
        players: [{ username: 'kutyi', socketId: 'test4' }],
        slots: 4,
        visibility: 'private',
        socketRoomId: 'game-2',
    },
    3: {
        name: 'Kiskutya jatszo',
        owner: 'Tamas',
        players: [
            { username: 'Tamas', socketId: 'test5' },
            { username: 'Julci', socketId: 'test6' },
        ],
        slots: 2,
        visibility: 'private',
        socketRoomId: 'game-3',
    },
}; */

export const modifyRooms = newRooms => {
    roomsList = newRooms;
};

/** A room player entry for `socket`'s user, with their chosen avatar (null: generated on the clients). */
const roomPlayer = (socket, username) => ({ username, socketId: socket?.id, avatar: socket?.data?.user?.avatar ?? null });

let ioServer = null;

/**
 * After user `userId` saved a new avatar (REST): updates their entry in every room and the
 * cached identity of their sockets, then broadcasts the room list so the change shows at
 * once (also on the game screen, which takes avatars from the room). Returns whether a
 * room changed.
 */
export const applyAvatarChange = (userId, username, avatar, io = ioServer) => {
    io?.of('/').sockets.forEach(socket => {
        const user = socket.data.user;
        if (user && !user.isGuest && user.id === userId) {
            socket.data.user = { ...user, avatar };
        }
    });
    let changed = false;
    roomsList = Object.fromEntries(
        Object.entries(roomsList).map(([roomId, room]) => {
            if (!room.players.some(player => player.username === username)) return [roomId, room];
            changed = true;
            const players = room.players.map(player => (player.username === username ? { ...player, avatar } : player));
            return [roomId, { ...room, players }];
        }),
    );
    if (changed) io?.emit('rooms-listed', roomsList);
    return changed;
};

/**
 * Points the user's seat in their room at this socket and re-joins the room's socket.io
 * room. Runs on every connection of an identified socket (new or recovered), so a player
 * who reconnects, e.g. after the app was in the background, can keep playing and receives
 * updates again. If the same user connects twice, the latest connection wins.
 */
const rebindPlayer = socket => {
    const user = socket.data.user;
    if (!user) return;
    Object.values(roomsList).forEach(room => {
        const player = room.players.find(roomPlayer => roomPlayer.username === user.username);
        if (player) {
            player.socketId = socket.id;
            socket.join(room.socketRoomId);
            socket.data.username = user.username;
            socket.data.roomId = room.socketRoomId;
        }
    });
};

export const rooms = io => {
    ioServer = io;
    io.on('connection', socket => {
        console.log('Client connected', socket.id);

        rebindPlayer(socket);

        socket.on('list-rooms', () => {
            socket.emit('rooms-listed', roomsList);
        });

        socket.on('create-room', ({ name, owner, slots, visibility, settings }) => {
            if (rejected(socket, identityError(socket, owner))) return;
            const newKey = Object.keys(roomsList).length === 0 ? 1 : +Object.keys(roomsList)[Object.keys(roomsList).length - 1] + 1;
            const socketRoomId = `game-${newKey}`;
            const newRoom = {
                name,
                owner,
                players: [roomPlayer(socket, owner)],
                slots,
                socketRoomId,
                visibility,
                settings: normalizeRoomSettings(settings),
            };
            roomsList = { ...roomsList, [newKey]: newRoom };

            // Socket joins new room -- TODO IS THIS NEEDED??? --> maybe for chat yes
            socket.data.username = owner;
            socket.data.roomId = socketRoomId;
            socket.join(socketRoomId);
            io.emit('rooms-listed', roomsList);
        });

        socket.on('update-room-settings', payload => {
            const { error, settings, visibility } = validateRoomSettingsUpdate(socket, payload);
            if (rejected(socket, error)) return;
            const { roomId } = payload;
            roomsList = { ...roomsList, [roomId]: { ...roomsList[roomId], settings, visibility } };
            io.emit('rooms-listed', roomsList);
        });

        socket.on('delete-room', roomId => {
            if (rejected(socket, identityError(socket) ?? roomError(socket, roomId, { ownerOnly: true }))) return;
            const { [roomId]: roomToDelete, ...rest } = roomsList;
            roomsList = rest;

            // TODO DELETE SOCKET ROOM HERE
            // TODO delete socket.data.roomId for everyone
            io.emit('room-deleted', roomsList);
        });

        socket.on('join-room', ({ username, roomId }) => {
            if (rejected(socket, identityError(socket, username) ?? roomError(socket, roomId))) return;
            roomsList = {
                ...roomsList,
                [roomId]: { ...roomsList[roomId], players: [...roomsList[roomId].players, roomPlayer(socket, username)] },
            };

            // Socket joins new room -- TODO IS THIS NEEDED??? --> maybe for chat yes
            socket.data.username = username;
            socket.data.roomId = `game-${roomId}`;
            socket.join(`game-${roomId}`);
            io.emit('joined-room', roomsList);
        });

        socket.on('leave-room', ({ username, roomId }) => {
            if (rejected(socket, identityError(socket, username) ?? roomError(socket, roomId))) return;
            roomsList = {
                ...roomsList,
                [roomId]: {
                    ...roomsList[roomId],
                    players: roomsList[roomId].players.filter(player => player.username !== username),
                    // slots: roomsList[roomId].slots - 1,
                },
            };

            // Socket leaves new room -- TODO IS THIS NEEDED??? --> maybe for chat yes
            socket.data.roomId = '';
            socket.leave(`game-${roomId}`);
            io.emit('left-room', roomsList);
        });

        // The owner ends the running game for everyone (nobody wins); the players go back to the lobby.
        socket.on('stop-game', roomId => {
            if (rejected(socket, stopGameError(socket, roomId))) return;
            const owner = roomsList[roomId].owner;
            const gameId = `game-${roomId}`;
            const rooms = stopGame(roomId);
            io.to(gameId).emit('game-stopped', owner, rooms);
            io.in(gameId).socketsLeave(gameId);
            io.emit('rooms-listed', rooms);
        });

        socket.on('start-game', async (roomId, socketId) => {
            if (rejected(socket, identityError(socket) ?? roomError(socket, roomId, { ownerOnly: true }))) return;
            // Set room's inGame to true
            const newRoom = { ...roomsList[roomId], inGame: true };
            roomsList = {
                ...roomsList,
                [roomId]: newRoom,
            };

            // Create new deck and shuffle it, init new game
            let deck = shuffleDeck(initialDeck);
            if (newRoom.players.length > 3) {
                deck = [...deck, ...shuffleDeck(initialDeck)];
            }
            const newGame = {
                players: {},
            };
            const rooms = io.of('/').adapter.rooms;
            const sas = io.of('/').adapter.rooms.get(`game-${roomId}`);
            console.log('ROOMS', rooms);
            console.log('ROOM asd', sas);
            // console.log(rooms[`game-${roomId}`]);
            console.log('USERNAME1', socket.username);
            // Populate Backend-side data of a game
            const rand = newRoom.players[Math.floor(Math.random() * newRoom.players.length)];
            newRoom.players.forEach(player => {
                newGame.players[player.username] = {};
                newGame.players[player.username].userCards = {
                    table: [deck.shift(), deck.shift(), deck.shift()],
                    tableFlipped: [deck.shift(), deck.shift(), deck.shift()],
                    hand: [deck.shift(), deck.shift(), deck.shift()],
                };
                // Random user to start
                newGame.players[player.username].active = rand.username === player.username;
            });
            newGame.deck = deck;
            // First everyone may swap hand cards with their face-up cards, until all are ready.
            newGame.phase = 'swap';
            games[roomId] = newGame;

            // Send new game data to sockets
            sendUiDataToSocket(io, newRoom, newGame, 'game-started', roomId);
        });
    });
};

// const currentRoomSockets = io.of('/').adapter.rooms[roomId];
// console.log(newRoom, newRoom.players, newGame);

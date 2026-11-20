// Keeps the in-memory rooms, games and chats in MySQL, so a server restart (a deploy, a crash)
// doesn't end them. The server still plays from memory; every second the rooms that changed
// are written to `game_snapshots` and the ones that are gone (won, stopped, deleted) removed.
// On start the snapshots are loaded back before the server takes connections; the players'
// apps reconnect and get their seats back by username (rebindPlayer in rooms.js).
//
// Privacy: the snapshots hold usernames, cards and the room's chat, only while the room exists
// (a game ends -> its row is deleted). Mention this in the privacy policy.
import { modifyRoomMessages, roomMessages } from './chat.js';
import { finishBlindMiss, startTurnClock } from './game.js';
import db from './models/index.js';
import { games, modifyRooms, roomsList, watchOwnersAfterRestart } from './rooms.js';

/** Which snapshots are this server's (servers sharing a database, e.g. tests, keep theirs apart). */
const SCOPE = process.env.SNAPSHOT_SCOPE || 'main';
/** How often changed rooms are written (ms). At most this much play is lost in a crash. */
const SNAPSHOT_MS = Number(process.env.SNAPSHOT_MS ?? 1000);
/** Snapshots older than this are not restored (rooms nobody came back to): 24 hours. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** The state of room `roomId` as stored: the room, its game (if started) and its chat. */
export const snapshotOf = roomId =>
    JSON.stringify({
        room: roomsList[roomId],
        game: games[roomId] ?? null,
        messages: roomMessages[`game-${roomId}`] ?? [],
    });

/**
 * Puts stored rooms back into memory. `rows`: `{ room_id, state }`. Returns the room ids.
 * The game's clocks are not running yet (`resumeClocks`).
 */
export const restoreRooms = rows => {
    const rooms = {};
    const restoredGames = {};
    const messages = {};
    for (const row of rows) {
        const { room, game, messages: chat } = JSON.parse(row.state);
        if (!room) continue;
        rooms[row.room_id] = room;
        if (game) restoredGames[row.room_id] = game;
        if (chat?.length) messages[`game-${row.room_id}`] = chat;
    }
    modifyRooms(rooms);
    Object.keys(games).forEach(id => delete games[id]);
    Object.assign(games, restoredGames);
    modifyRoomMessages(messages);
    return Object.keys(rooms).map(Number);
};

/**
 * Restarts what was running when the snapshot was taken: each turn gets its full time again,
 * a missed blind card being shown is picked up at once, and every running game waits for its
 * owner to come back (as after a disconnect: stopped if they don't within 2 minutes).
 */
export const resumeClocks = io => {
    Object.entries(games).forEach(([roomId, game]) => {
        game.turnEndsAt = null;
        game.turnTime = null;
        if (game.blindMiss) finishBlindMiss(io, roomId, game);
        else startTurnClock(io, roomId, game);
    });
    watchOwnersAfterRestart(io);
};

/** What was last written per room id (to write only the rooms that changed). */
const written = new Map();
let writing = Promise.resolve();

/** Writes the rooms that changed since the last write and deletes the snapshots of rooms that are gone. */
export const writeSnapshots = () => {
    writing = writing
        .then(async () => {
            const current = new Map(Object.keys(roomsList).map(id => [Number(id), snapshotOf(id)]));
            for (const [roomId, state] of current) {
                if (written.get(roomId) === state) continue;
                await db.game_snapshot.upsert({ scope: SCOPE, room_id: roomId, state });
                written.set(roomId, state);
            }
            const gone = [...written.keys()].filter(roomId => !current.has(roomId));
            if (gone.length) {
                await db.game_snapshot.destroy({ where: { scope: SCOPE, room_id: gone } });
                gone.forEach(roomId => written.delete(roomId));
            }
        })
        .catch(error => console.error('Saving the games failed:', error.message));
    return writing;
};

/**
 * On start: loads this server's snapshots (younger than a day) into memory, restarts their
 * clocks, then writes changes every second. On SIGTERM / SIGINT the last changes are written
 * before the process exits.
 */
export const startPersistence = async io => {
    const rows = await db.game_snapshot.findAll({ where: { scope: SCOPE }, raw: true });
    const fresh = rows.filter(row => Date.now() - new Date(row.updatedAt).getTime() < MAX_AGE_MS);
    const restored = restoreRooms(fresh);
    fresh.forEach(row => written.set(row.room_id, row.state));
    // Stale ones (and the fresh ones' old rows, rewritten by the next write if they change).
    const stale = rows.filter(row => !fresh.includes(row)).map(row => row.room_id);
    if (stale.length) await db.game_snapshot.destroy({ where: { scope: SCOPE, room_id: stale } });
    resumeClocks(io);
    if (restored.length) console.log(`Restored ${restored.length} room(s) from the last run.`);

    const timer = setInterval(writeSnapshots, SNAPSHOT_MS);
    const flushAndExit = async () => {
        clearInterval(timer);
        await writeSnapshots();
        process.exit(0);
    };
    process.once('SIGTERM', flushAndExit);
    process.once('SIGINT', flushAndExit);
};

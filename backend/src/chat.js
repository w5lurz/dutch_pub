import { roomById } from './rooms.js';
import { identityError } from './socketAuth.js';

/** Longest chat message (as the app's input). */
export const CHAT_MAX_LENGTH = 256;
/** Messages kept per room: older ones drop off (each new message sends the whole history). */
export const CHAT_HISTORY = 50;
/** One message per second per player at most (the app waits 3 s anyway). Env for tests. */
const CHAT_GAP_MS = Number(process.env.CHAT_GAP_MS ?? 1000);
/** When each player last sent a message. */
const lastSent = new Map();

export let roomMessages = {};

export const modifyRoomMessages = newMessages => {
    roomMessages = newMessages;
};

export const chat = io => {
    io.on('connection', socket => {
        socket.on('send-message', payload => {
            const { roomId, username, message } = payload ?? {};
            const room = roomById(roomId);
            const text = typeof message === 'string' ? message.trim() : '';
            const error =
                identityError(socket, username) ??
                (!room || !room.players.some(player => player.username === username) ? 'You are not in this room.' : null) ??
                (!text || text.length > CHAT_MAX_LENGTH ? `A message has 1 to ${CHAT_MAX_LENGTH} characters.` : null) ??
                (Date.now() - (lastSent.get(username) ?? 0) < CHAT_GAP_MS ? 'Wait a moment before the next message.' : null);
            if (error) {
                socket.emit('action-rejected', error);
                return;
            }
            lastSent.set(username, Date.now());
            const history = roomMessages[`game-${roomId}`] ?? [];
            const date = new Date();
            roomMessages[`game-${roomId}`] = [
                ...history.slice(-(CHAT_HISTORY - 1)),
                {
                    // Counts on after old messages dropped off (the app keys the list by id).
                    id: (history[history.length - 1]?.id ?? 0) + 1,
                    senderName: username,
                    message: text,
                    time: date.toLocaleTimeString('hu-HU', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    }),
                },
            ];
            io.to(`game-${roomId}`).emit('message-sent', roomMessages[`game-${roomId}`]);
        });
    });
};

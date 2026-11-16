import { roomsList } from './rooms.js';
import { identityError } from './socketAuth.js';

export let roomMessages = {};

export const modifyRoomMessages = newMessages => {
    roomMessages = newMessages;
};

export const chat = io => {
    io.on('connection', socket => {
        socket.on('send-message', async ({ roomId, username, message }) => {
            const room = roomsList[roomId];
            const error =
                identityError(socket, username) ??
                (!room || !room.players.some(player => player.username === username) ? 'You are not in this room.' : null);
            if (error) {
                socket.emit('action-rejected', error);
                return;
            }
            if (!roomMessages[`game-${roomId}`]) {
                roomMessages[`game-${roomId}`] = [];
            }
            const date = new Date();
            roomMessages[`game-${roomId}`] = [
                ...roomMessages[`game-${roomId}`],
                {
                    id: roomMessages[`game-${roomId}`].length + 1,
                    senderName: username,
                    message,
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

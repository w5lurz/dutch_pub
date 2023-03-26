export let roomMessages = {}; // TODO delete me if game ended

export const chat = io => {
    io.on('connection', socket => {
        socket.on('send-message', async ({ roomId, username, message }) => {
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

export const chat = io => {
    io.on('connection', socket => {
        socket.on('send-message', async ({ roomId, username, message }) => {
            io.to(`game-${roomId}`).emit('message-sent', username, message);
        });
    });
};

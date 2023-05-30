import { guestsList, modifyGuestsList } from './controllers/auth.controller';

export const guests = io => {
    io.on('connection', socket => {
        socket.on('get-socketid', () => {
            socket.emit('got-socketid', socket.id);
        });

        socket.on('disconnect', () => {
            if (guestsList.find(guest => guest.socketId === socket.id)) {
                modifyGuestsList(guestsList.filter(guest => guest.socketId !== socket.id));
            }
            console.log('Client disconnected', socket.id, socket.data.username, socket.data.roomId, guestsList);
        });
    });
};

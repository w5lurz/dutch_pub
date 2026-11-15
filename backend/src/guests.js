import { guestsList, modifyGuestsList } from './controllers/auth.controller.js';

export const guests = io => {
    io.on('connection', socket => {
        socket.on('get-socketid', () => {
            socket.emit('got-socketid', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected1', socket.id, guestsList);
            if (guestsList.find(guest => guest.socketId === socket.id)) {
                modifyGuestsList(guestsList.filter(guest => guest.socketId !== socket.id));
            }
            console.log('Client disconnected2', socket.id, socket.data.username, socket.data.roomId, guestsList);
        });
    });
};

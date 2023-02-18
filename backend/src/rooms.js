let roomsList = {
    1: {
        name: 'First Room',
        owner: 'kiskutya',
        players: ['kiskutya', 'kiscica', 'hehe'],
        slots: 4,
    },
    2: {
        name: 'Second Room',
        owner: 'kiscica',
        players: ['kiscica'],
        slots: 4,
    },
    3: {
        name: 'Kiskutya jatszo',
        owner: 'Tamas',
        players: ['Tamas', 'Julci'],
        slots: 2,
    },
};

export const rooms = io => {
    io.on('connection', socket => {
        console.log('Client connected', socket.id);

        socket.on('list-rooms', () => {
            console.log('LIST ROOMS');
            socket.emit('rooms-listed', roomsList);
        });
        socket.on('create-room', ({ name, owner, slots }) => {
            console.log('CREATAE', name, slots, socket.id);
            const newKey = +Object.keys(roomsList)[Object.keys(roomsList).length - 1] + 1;
            const newRoom = {
                name,
                owner,
                players: [owner],
                slots,
            };
            roomsList = { ...roomsList, [newKey]: newRoom };
            // socket.emit('rooms-listed', roomsList);
            io.emit('rooms-listed', roomsList);
        });
        socket.on('delete-room', roomId => {
            console.log('DELETe', roomId);
            const { [roomId]: roomToDelete, ...rest } = roomsList;
            roomsList = rest;
            // socket.emit('rooms-listed', roomsList);
            io.emit('room-deleted', roomsList);
        });
        socket.on('join-room', ({ username, roomId }) => {
            roomsList = {
                ...roomsList,
                [roomId]: { ...roomsList[roomId], players: [...roomsList[roomId].players, username], slots: roomsList[roomId].slots + 1 },
            };
            console.log(roomsList);
            io.emit('joined-room', roomsList);
        });
        socket.on('leave-room', ({ username, roomId }) => {
            roomsList = {
                ...roomsList,
                [roomId]: {
                    ...roomsList[roomId],
                    players: roomsList[roomId].players.filter(player => player !== username),
                    slots: roomsList[roomId].slots - 1,
                },
            };
            console.log(roomsList);
            io.emit('left-room', roomsList);
        });
    });
    // io.on('list-rooms', socket => {
    //     io.emit('rooms-listed', roomsList)
    // })
    // io.on('create-room')
};

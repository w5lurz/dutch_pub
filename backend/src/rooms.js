import { deck as initialDeck, sendUiDataToSocket, shuffleDeck } from './game';

export let games = {};

export let roomsList = {
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
};

export const rooms = io => {
    io.on('connection', socket => {
        console.log('Client connected', socket.id);

        socket.on('list-rooms', () => {
            socket.emit('rooms-listed', roomsList);
        });

        socket.on('create-room', ({ name, owner, slots }) => {
            const newKey = +Object.keys(roomsList)[Object.keys(roomsList).length - 1] + 1;
            const socketRoomId = `game-${newKey}`;
            const newRoom = {
                name,
                owner,
                players: [{ username: owner, socketId: socket?.id }],
                slots,
                socketRoomId,
            };
            roomsList = { ...roomsList, [newKey]: newRoom };

            // Socket joins new room -- TODO IS THIS NEEDED??? --> maybe for chat yes
            socket.join(socketRoomId);
            io.emit('rooms-listed', roomsList);
        });

        socket.on('delete-room', roomId => {
            const { [roomId]: roomToDelete, ...rest } = roomsList;
            roomsList = rest;

            // TODO DELETE SOCKET ROOM HERE
            io.emit('room-deleted', roomsList);
        });

        socket.on('join-room', ({ username, roomId }) => {
            roomsList = {
                ...roomsList,
                [roomId]: { ...roomsList[roomId], players: [...roomsList[roomId].players, { username, socketId: socket?.id }] },
            };

            // Socket joins new room -- TODO IS THIS NEEDED??? --> maybe for chat yes
            socket.join(`game-${roomId}`);
            io.emit('joined-room', roomsList);
        });

        socket.on('leave-room', ({ username, roomId }) => {
            roomsList = {
                ...roomsList,
                [roomId]: {
                    ...roomsList[roomId],
                    players: roomsList[roomId].players.filter(player => player.username !== username),
                    // slots: roomsList[roomId].slots - 1,
                },
            };

            // Socket leaves new room -- TODO IS THIS NEEDED??? --> maybe for chat yes
            socket.leave(`game-${roomId}`);
            io.emit('left-room', roomsList);
        });

        socket.on('start-game', async (roomId, socketId) => {
            // Set room's inGame to true
            const newRoom = { ...roomsList[roomId], inGame: true };
            roomsList = {
                ...roomsList,
                [roomId]: newRoom,
            };

            // Create new deck and shuffle it, init new game
            const deck = shuffleDeck(initialDeck);
            if (newRoom.players.length > 3) {
                deck = [...deck, shuffleDeck(initialDeck)];
            }
            const newGame = {
                players: {},
            };

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
            games[roomId] = newGame;

            // Send new game data to sockets
            sendUiDataToSocket(io, newRoom, newGame, 'game-started', roomId);
        });
    });
};

// const currentRoomSockets = io.of('/').adapter.rooms[roomId];
// console.log(newRoom, newRoom.players, newGame);

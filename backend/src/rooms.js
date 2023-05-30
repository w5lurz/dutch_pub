import { deck as initialDeck, sendUiDataToSocket, shuffleDeck } from './game';

export let games = {};

export let roomsList = {};

export const modifyRooms = newRooms => {
    roomsList = newRooms;
};

export const rooms = io => {
    io.on('connection', socket => {
        console.log('Client connected', socket.id);

        if (socket.recovered) {
            console.log('Recovered socket', socket.id, socket.data);
            console.log('Recovered username', socket.data.username);
            console.log('Recovered roomId', socket.data.roomId);
            const foundRoom = Object.values(roomsList).find(room => room.socketRoomId === socket.data.roomId);
            if (foundRoom) {
                const players = foundRoom.players;
                const foundPlayer = players.find(player => player.username === socket.data.username);
                foundPlayer.socketId = socket.id;
            }
        }

        socket.on('list-rooms', () => {
            socket.emit('rooms-listed', roomsList);
        });

        socket.on('create-room', ({ name, owner, slots, visibility }) => {
            const newKey = Object.keys(roomsList).length === 0 ? 1 : +Object.keys(roomsList)[Object.keys(roomsList).length - 1] + 1;
            const socketRoomId = `game-${newKey}`;
            const newRoom = {
                name,
                owner,
                players: [{ username: owner, socketId: socket?.id }],
                slots,
                socketRoomId,
                visibility,
            };
            roomsList = { ...roomsList, [newKey]: newRoom };

            socket.data.username = owner;
            socket.data.roomId = socketRoomId;
            socket.join(socketRoomId);
            io.emit('rooms-listed', roomsList);
        });

        socket.on('delete-room', roomId => {
            const { [roomId]: roomToDelete, ...rest } = roomsList;
            roomsList = rest;

            io.emit('room-deleted', roomsList);
        });

        socket.on('join-room', ({ username, roomId }) => {
            roomsList = {
                ...roomsList,
                [roomId]: { ...roomsList[roomId], players: [...roomsList[roomId].players, { username, socketId: socket?.id }] },
            };

            socket.data.username = username;
            socket.data.roomId = `game-${roomId}`;
            socket.join(`game-${roomId}`);
            io.emit('joined-room', roomsList);
        });

        socket.on('leave-room', ({ username, roomId }) => {
            roomsList = {
                ...roomsList,
                [roomId]: {
                    ...roomsList[roomId],
                    players: roomsList[roomId].players.filter(player => player.username !== username),
                },
            };

            socket.data.roomId = '';
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
            let deck = shuffleDeck(initialDeck);
            if (newRoom.players.length > 3) {
                deck = [...deck, ...shuffleDeck(initialDeck)];
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

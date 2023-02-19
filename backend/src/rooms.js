import { deck as initialDeck, shuffleDeck } from './game';
import db from './models';
const User = db.user;

let games = {};

let roomsList = {
    1: {
        name: 'First Room',
        owner: 'kiskutya',
        players: ['kiskutya', 'kiscica', 'hehe'],
        slots: 4,
        socketRoomId: 'game-1',
    },
    2: {
        name: 'Second Room',
        owner: 'kiscica',
        players: ['kiscica'],
        slots: 4,
        socketRoomId: 'game-2',
    },
    3: {
        name: 'Kiskutya jatszo',
        owner: 'Tamas',
        players: ['Tamas', 'Julci'],
        slots: 2,
        socketRoomId: 'game-3',
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
            const socketRoomId = `game-${newKey}`;
            const newRoom = {
                name,
                owner,
                players: [owner],
                slots,
                socketRoomId,
            };
            roomsList = { ...roomsList, [newKey]: newRoom };
            // socket.emit('rooms-listed', roomsList);
            socket.join(socketRoomId);
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
                [roomId]: { ...roomsList[roomId], players: [...roomsList[roomId].players, username] },
            };
            console.log(roomsList);
            socket.join(`game-${roomId}`);
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
            socket.leave(`game-${roomId}`);
            io.emit('left-room', roomsList);
        });

        socket.on('start-game', async roomId => {
            const newRoom = { ...roomsList[roomId], inGame: true };
            roomsList = {
                ...roomsList,
                [roomId]: newRoom,
            };
            console.log('START GAME', roomsList, socket.id);
            console.log('IO ROOMS', io.of('/').adapter.rooms);
            const deck = shuffleDeck(initialDeck);
            console.log('START GAME1', deck);
            if (newRoom.players.length > 3) {
                deck = [...deck, shuffleDeck(initialDeck)];
            }

            /* const newGame = {
                userCards: {
                    table: [deck.shift(), deck.shift(), deck.shift()],
                    tableFlipped: [deck.shift(), deck.shift(), deck.shift()],
                    hand: [deck.shift(), deck.shift(), deck.shift()],
                },
                deck,
            },

            games = {
                ...games,
                [roomId]: newGame,
            };*/
            // const deck2 = shuffleDeck(deck);
            // const gameC
            const newGame = {
                // userCards: {},
                // deck,
            };

            const playerSpecificGameData = {
                userCards: {},
                opponents: {},
            };

            const user = await User.findOne({ where: { username: req?.session?.username } });

            // Populate Backend-side data of a game
            const currentRoomSockets = io.of('/').adapter.rooms[roomId];
            newRoom.players.forEach(player => {
                newGame[player].userCards = {
                    table: [deck.shift(), deck.shift(), deck.shift()],
                    tableFlipped: [deck.shift(), deck.shift(), deck.shift()],
                    hand: [deck.shift(), deck.shift(), deck.shift()],
                };
            });
            newGame.deck = deck;

            newRoom.players.forEach(player => {
                if (player === user?.username) {
                    playerSpecificGameData.userCards = { ...newGame[player].userCards };
                } else {
                    playerSpecificGameData.opponents[player].table = newGame[player].userCards.table.length;
                    playerSpecificGameData.opponents[player].hand = newGame[player].userCards.hand.length;
                    playerSpecificGameData.opponents[player].tableFlipped = { ...newGame[player].userCards.tableFlipped };
                }
            });
            playerSpecificGameData.deck = deck;
            console.log('HEHEHE', newGame);
            games[roomId] = newGame;

            socket.emit('game-started', roomsList, playerSpecificGameData);

            // currentRoomSockets.forEach(socketId => {});
            // io.to(`game-${roomId}`).emit('game-started', roomsList, games[roomId]);
            // io.emit('joined-room', roomsList);
        });
    });
    // io.on('list-rooms', socket => {
    //     io.emit('rooms-listed', roomsList)
    // })
    // io.on('create-room')
};

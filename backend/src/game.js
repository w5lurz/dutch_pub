import { canLayCard } from '@dutch-pub/shared';
import { games, modifyRooms, roomsList } from './rooms.js';
import { modifyRoomMessages, roomMessages } from './chat.js';

import db from './models/index.js';
const PlayedGame = db.played_game;

const handleClearAll = () => {};

/**
 * Checks a `lay-card` request against the server-side game state.
 * Returns `{ error }` when the move must be rejected, otherwise `{ card }`: the server's own
 * copy of the card (so client-sent flags like isMagicCard are never trusted), or the
 * face-down table card index for a blind play.
 */
export const validateLayCard = (socket, { card, roomId, username }) => {
    const currentRoom = roomsList[roomId];
    const currentGame = games[roomId];
    if (!currentRoom || !currentGame) {
        return { error: 'This game does not exist.' };
    }
    const player = currentGame.players[username];
    const roomPlayer = currentRoom.players.find(roomPlayer => roomPlayer.username === username);
    if (!player || !roomPlayer || roomPlayer.socketId !== socket.id) {
        return { error: 'You are not a player in this game.' };
    }
    if (!player.active) {
        return { error: 'It is not your turn.' };
    }

    const { hand, tableFlipped, table } = player.userCards;
    if (typeof card === 'number') {
        if (hand.length !== 0 || tableFlipped.length !== 0) {
            return { error: 'You have to play your other cards first.' };
        }
        if (!Number.isInteger(card) || card < 0 || card >= table.length) {
            return { error: 'That card does not exist.' };
        }
        // Blind card: whether it fits the pile is decided after revealing it.
        return { card };
    }

    const playableCards = hand.length !== 0 ? hand : tableFlipped;
    const serverCard = card && playableCards.find(ownCard => ownCard.value === card.value && ownCard.color === card.color);
    if (!serverCard) {
        return { error: "You don't have that card." };
    }
    if (!canLayCard(serverCard, currentGame.laidCards)) {
        return { error: 'You cannot lay that card.' };
    }
    return { card: serverCard };
};

export const game = io => {
    io.on('connection', socket => {
        socket.on('lay-card', async payload => {
            const { cardIndex, roomId, username } = payload;
            const validation = validateLayCard(socket, payload);
            if (validation.error) {
                console.log('LAY CARD REJECTED', validation.error, payload);
                socket.emit('lay-card-rejected', validation.error);
                return;
            }
            const card = validation.card;
            const currentRoom = roomsList[roomId];
            const currentGame = games[roomId];
            let currentLaidCard = card;
            console.log('LAY CARD1', card, cardIndex, roomId, username);
            // TODO: with >3 players two decks are used, so a hand can hold identical cards (same value + color).
            // These filters remove every matching copy instead of just the one laid; remove a single card instead.
            // Deleting laid card from hand
            if (currentGame.players[username].userCards.hand.length !== 0) {
                currentGame.players[username].userCards.hand = currentGame.players[username].userCards.hand.filter(
                    handCard => !(handCard.value === card.value && handCard.color === card.color),
                );
            }
            // Deleting table flipped card (if hand is empty)
            if (
                currentGame.players[username].userCards.hand.length === 0 &&
                currentGame.players[username].userCards.tableFlipped.length !== 0
            ) {
                currentGame.players[username].userCards.tableFlipped = currentGame.players[username].userCards.tableFlipped.filter(
                    tableFlippedCard => !(tableFlippedCard.value === card.value && tableFlippedCard.color === card.color),
                );
            }
            let isValidLastLaidCard = true;
            if (
                // TODO TEST what if it is a number, we should reveal that to UI
                typeof card === 'number' &&
                currentGame.players[username].userCards.hand.length === 0 &&
                currentGame.players[username].userCards.tableFlipped.length === 0
            ) {
                console.log('LASTLAID', username, card);
                console.log('LASTLAID', currentGame.players[username].userCards.table);
                currentLaidCard = currentGame.players[username].userCards.table.find((_, i) => i === card);
                currentGame.players[username].userCards.table = currentGame.players[username].userCards.table.filter((_, i) => i !== card);
                isValidLastLaidCard = canLayCard(currentLaidCard, currentGame.laidCards);
                console.log('LAST ROUND', isValidLastLaidCard, currentGame.laidCards);
            }
            if (!isValidLastLaidCard) {
                // const lastLaidCard = currentGame.laidCards ? currentGame.laidCards[0] : null;
                // TODO this is filtered up, will be undefined, FIXMEE
                // currentLaidCard = currentGame.players[username].userCards.table.find((_, i) => i === card);
                console.log('LAST ROUND1', isValidLastLaidCard, currentLaidCard, currentGame.players[username].userCards.table);
                // Setting hand with drawn cards
                currentGame.players[username].userCards.hand = [currentLaidCard, ...currentGame.laidCards].sort(
                    (a, b) => a.value - b.value,
                );

                // Setting laidCards to null (given to hand)
                currentGame.laidCards = null;

                // Setting active player to next
                setActivePlayerNext(currentGame.players, username);

                // Send new game data to sockets
                console.log('DRAWNHEHE', currentGame.players[username].userCards.hand);
                sendUiDataToSocket(io, currentRoom, currentGame, 'cards-drawn');
            } else {
                // Add top card from deck to hand if hand.length < 3
                const cardToAddToHand =
                    currentGame.deck.length && currentGame.players[username].userCards.hand.length < 3 && currentGame.deck.shift();
                cardToAddToHand && currentGame.players[username].userCards.hand.splice(cardIndex, 0, cardToAddToHand);

                // If laid card is a 10 we burn all laid cards
                // TODO TEST of setting active player next when burning cards
                if (currentLaidCard?.value === 10) {
                    currentGame.burntCards = currentGame.burntCards
                        ? [currentLaidCard, ...(currentGame.laidCards ? currentGame.laidCards : []), ...currentGame.burntCards]
                        : [currentLaidCard, ...(currentGame.laidCards ? currentGame.laidCards : [])];
                    currentGame.laidCards = null;
                } else if (isLastFourCardsSame(currentGame.laidCards, currentLaidCard)) {
                    currentGame.burntCards = [
                        currentLaidCard,
                        ...currentGame.laidCards,
                        ...(currentGame.burntCards ? currentGame.burntCards : []),
                    ];
                    currentGame.laidCards = null;
                } else {
                    console.log('ELSE', card, cardIndex);
                    currentGame.laidCards = currentGame.laidCards ? [currentLaidCard, ...currentGame.laidCards] : [currentLaidCard];
                    console.log('SET NEXT', username);
                    // Setting active player to next
                    setActivePlayerNext(currentGame.players, username);
                }
                // TODO SET WINNER HERE
                if (
                    currentGame.players[username].userCards.hand.length === 0 &&
                    currentGame.players[username].userCards.tableFlipped.length === 0 &&
                    currentGame.players[username].userCards.table.length === 0
                ) {
                    const gameId = `game-${roomId}`;
                    let { [roomId]: omit, ...rest } = roomsList;
                    console.log('REST1', rest);
                    modifyRooms(rest);
                    io.to(gameId).emit('game-won', username, roomsList);

                    console.log('GAMEWON', card);
                    // TODO DELETE ROOM
                    io.in(gameId).socketsLeave(gameId);
                    let { [gameId]: deleted, ...restRoomMessages } = roomMessages;
                    modifyRoomMessages(restRoomMessages);
                    console.log('GAMEWON1', roomsList);
                    await PlayedGame.create({
                        winner: username,
                        players: currentRoom.players.map(player => player.username).join(','),
                    });
                }

                // Send new game data to sockets
                console.log('CARD LAYED', card, currentLaidCard, username, currentGame.players);
                sendUiDataToSocket(io, currentRoom, currentGame, 'card-laid');
            }
        });

        // TODO: not validated yet - any client can make any player pick up the pile, even out of turn.
        // Add the same game / identity (socket.id) / active-turn checks as validateLayCard.
        socket.on('draw-cards', ({ roomId, username }) => {
            const currentRoom = roomsList[roomId];
            const currentGame = games[roomId];

            // Setting hand with drawn cards
            currentGame.players[username].userCards.hand = [
                ...(currentGame.players[username].userCards.hand && currentGame.players[username].userCards.hand.length > 0
                    ? currentGame.players[username].userCards.hand
                    : []),
                ...(currentGame.laidCards ? currentGame.laidCards : []),
            ].sort((a, b) => a.value - b.value);

            // Setting laidCards to null (given to hand)
            currentGame.laidCards = null;

            // Setting active player to next
            setActivePlayerNext(currentGame.players, username);

            // Send new game data to sockets
            console.log('DRAWNHEHE', currentGame.players);
            sendUiDataToSocket(io, currentRoom, currentGame, 'cards-drawn');
        });
    });
};

const isLastFourCardsSame = (laidCards, card) =>
    laidCards &&
    laidCards[0] &&
    laidCards[1] &&
    laidCards[2] &&
    card.value === laidCards[0].value &&
    laidCards[0].value === laidCards[1].value &&
    laidCards[1].value === laidCards[2].value;

export const sendUiDataToSocket = async (io, room, game, message, roomId) => {
    const rooms = io.of('/').adapter.rooms;
    console.log(rooms);
    console.log(rooms[`game-${roomId}`]);
    const sockets = await io.fetchSockets();
    console.log('SOCKETS 2', sockets[0].username);
    console.log('SOCKETS 2', sockets[1].username);

    room.players.forEach(player => {
        const playerSpecificGameData = {
            userCards: {},
            opponents: {},
        };
        playerSpecificGameData.userCards = {
            ...game.players[player.username].userCards,
            table: game.players[player.username].userCards.table.length,
        };

        room.players.forEach(otherPlayer => {
            if (player.socketId !== otherPlayer.socketId) {
                playerSpecificGameData.opponents[otherPlayer.username] = {};
                playerSpecificGameData.opponents[otherPlayer.username].table = game.players[otherPlayer.username].userCards.table.length;
                playerSpecificGameData.opponents[otherPlayer.username].hand = game.players[otherPlayer.username].userCards.hand.length;
                playerSpecificGameData.opponents[otherPlayer.username].tableFlipped = [
                    ...game.players[otherPlayer.username].userCards.tableFlipped,
                ];
                playerSpecificGameData.opponents[otherPlayer.username].active = game.players[otherPlayer.username].active;
            }
        });
        playerSpecificGameData.laidCards = game.laidCards ? game.laidCards : null;
        playerSpecificGameData.burntCards = game.burntCards ? game.burntCards : null;
        playerSpecificGameData.deck = game.deck.length;
        playerSpecificGameData.active = game.players[player.username].active;

        io.to(player.socketId).emit(message, playerSpecificGameData, roomsList, roomId);
    });
};

const setActivePlayerNext = (players, username) => {
    const activePlayerIndex = Object.values(players).findIndex(playerSpecificGame => playerSpecificGame.active);
    players[username].active = false;
    if (activePlayerIndex + 1 >= Object.keys(players).length) {
        Object.values(players)[0].active = true;
    } else {
        Object.values(players)[activePlayerIndex + 1].active = true;
    }
    console.log('SET NEXT2', players);
};

export let deck = [
    // Clubs
    { name: 'Start Over', value: 2, color: 'clubs', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'clubs' },
    { name: '4', value: 4, color: 'clubs' },
    { name: '5', value: 5, color: 'clubs' },
    { name: '6', value: 6, color: 'clubs' },
    { name: '7', value: 7, color: 'clubs' },
    { name: 'Mirror', value: 0, color: 'clubs', isMagicCard: true },
    { name: 'You lose', value: 9, color: 'clubs', isTeaseCard: true },
    { name: 'Clear all', value: 10, color: 'clubs', isMagicCard: true },
    { name: 'J', value: 11, color: 'clubs' },
    { name: 'Q', value: 12, color: 'clubs' },
    { name: 'K', value: 13, color: 'clubs' },
    { name: 'Call Next', value: 14, color: 'clubs', isMagicCard: true },
    // Diamonds
    { name: 'Start Over', value: 2, color: 'diamonds', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'diamonds' },
    { name: '4', value: 4, color: 'diamonds' },
    { name: '5', value: 5, color: 'diamonds' },
    { name: '6', value: 6, color: 'diamonds' },
    { name: '7', value: 7, color: 'diamonds' },
    { name: 'Mirror', value: 0, color: 'diamonds', isMagicCard: true },
    { name: 'You lose', value: 9, color: 'diamonds', isTeaseCard: true },
    { name: 'Clear all', value: 10, color: 'diamonds', isMagicCard: true },
    { name: 'J', value: 11, color: 'diamonds' },
    { name: 'Q', value: 12, color: 'diamonds' },
    { name: 'K', value: 13, color: 'diamonds' },
    { name: 'Call Next', value: 14, color: 'diamonds', isMagicCard: true },
    // Hearts
    { name: 'Start Over', value: 2, color: 'hearts', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'hearts' },
    { name: '4', value: 4, color: 'hearts' },
    { name: '5', value: 5, color: 'hearts' },
    { name: '6', value: 6, color: 'hearts' },
    { name: '7', value: 7, color: 'hearts' },
    { name: 'Mirror', value: 0, color: 'hearts', isMagicCard: true },
    { name: 'You lose', value: 9, color: 'hearts', isTeaseCard: true },
    { name: 'Clear all', value: 10, color: 'hearts', isMagicCard: true },
    { name: 'J', value: 11, color: 'hearts' },
    { name: 'Q', value: 12, color: 'hearts' },
    { name: 'K', value: 13, color: 'hearts' },
    { name: 'Call Next', value: 14, color: 'hearts', isMagicCard: true },
    // Spades
    { name: 'Start Over', value: 2, color: 'spades', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'spades' },
    { name: '4', value: 4, color: 'spades' },
    { name: '5', value: 5, color: 'spades' },
    { name: '6', value: 6, color: 'spades' },
    { name: '7', value: 7, color: 'spades' },
    { name: 'Mirror', value: 0, color: 'spades', isMagicCard: true },
    { name: 'You lose', value: 9, color: 'spades', isTeaseCard: true },
    { name: 'Clear all', value: 10, color: 'spades', isMagicCard: true },
    { name: 'J', value: 11, color: 'spades' },
    { name: 'Q', value: 12, color: 'spades' },
    { name: 'K', value: 13, color: 'spades' },
    { name: 'Call Next', value: 14, color: 'spades', isMagicCard: true },
];

export const shuffleDeck = deck => [...deck].sort(() => Math.random() - 0.5);

import { games, roomsList } from './rooms';

const handleClearAll = () => {};

export const game = io => {
    io.on('connection', socket => {
        socket.on('lay-card', ({ card, cardIndex, roomId, username }) => {
            const currentRoom = roomsList[roomId];
            const currentGame = games[roomId];
            let currentLaidCard = card;

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
                currentLaidCard = currentGame.players[username].userCards.table.find((_, i) => i === card);
                currentGame.players[username].userCards.table = currentGame.players[username].userCards.table.filter((_, i) => i !== card);
                const lastLaidCard = currentGame.laidCards ? currentGame.laidCards[0] : null;
                const secondLaidCard = currentGame.laidCards ? currentGame.laidCards[1] : null;
                isValidLastLaidCard =
                    !lastLaidCard ||
                    (lastLaidCard.value <= currentLaidCard.value &&
                        ((!lastLaidCard.isMagicCard && !lastLaidCard.isTeaseCard) ||
                            (lastLaidCard.isMagicCard && lastLaidCard.value === 2))) ||
                    (!lastLaidCard.isTeaseCard && currentLaidCard.isMagicCard) ||
                    (lastLaidCard.isMagicCard && lastLaidCard.value === 14 && currentLaidCard.isMagicCard) ||
                    (lastLaidCard.isMagicCard && lastLaidCard.value === 0 && secondLaidCard?.value <= currentLaidCard.value) ||
                    (lastLaidCard.isMagicCard && lastLaidCard.value === 2 && lastLaidCard.value <= currentLaidCard.value) ||
                    (lastLaidCard.isTeaseCard && currentLaidCard.value >= 3 && currentLaidCard.value <= 7);
                console.log('LAST ROUND', isValidLastLaidCard);
            }
            if (!isValidLastLaidCard) {
                console.log('LAST ROUND1', isValidLastLaidCard);
                // Setting hand with drawn cards
                currentGame.players[username].userCards.hand = [lastLaidCard, ...currentGame.laidCards];

                // Setting laidCards to null (given to hand)
                currentGame.laidCards = null;

                // Setting active player to next
                setActivePlayerNext(currentGame.players, username);

                // Send new game data to sockets
                console.log('DRAWNHEHE', currentGame.players);
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
                    currentGame.laidCards = currentGame.laidCards ? [currentLaidCard, ...currentGame.laidCards] : [currentLaidCard];
                    // TODO SET WINNER HERE
                    if (typeof card === 'number' && card === 0) {
                        const { [roomId]: omit, ...rest } = roomsList;
                        roomsList = rest;
                        io.to(`game-${roomId}`).emit('game-won', username, roomsList);
                    }
                    // Setting active player to next
                    setActivePlayerNext(currentGame.players, username);
                }

                // Send new game data to sockets
                console.log('CARD LAYED', card, currentLaidCard, username, currentGame.players);
                sendUiDataToSocket(io, currentRoom, currentGame, 'card-laid');
            }
        });

        socket.on('draw-cards', ({ roomId, username }) => {
            const currentRoom = roomsList[roomId];
            const currentGame = games[roomId];

            // Setting hand with drawn cards
            currentGame.players[username].userCards.hand = [
                ...(currentGame.players[username].userCards.hand && currentGame.players[username].userCards.hand.length > 0
                    ? currentGame.players[username].userCards.hand
                    : []),
                ...(currentGame.laidCards ? currentGame.laidCards : []),
            ];

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

export const sendUiDataToSocket = (io, room, game, message, roomId) => {
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
};

export const deck = [
    // Clubs
    { name: 'Start Over (2)', value: 2, color: 'clubs', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'clubs' },
    { name: '4', value: 4, color: 'clubs' },
    { name: '5', value: 5, color: 'clubs' },
    { name: '6', value: 6, color: 'clubs' },
    { name: '7', value: 7, color: 'clubs' },
    { name: 'Mirror (8)', value: 0, color: 'clubs', isMagicCard: true },
    { name: 'You lose (9)', value: 9, color: 'clubs', isTeaseCard: true },
    { name: 'Clear all (10)', value: 10, color: 'clubs', isMagicCard: true },
    { name: 'J', value: 11, color: 'clubs' },
    { name: 'Q', value: 12, color: 'clubs' },
    { name: 'K', value: 13, color: 'clubs' },
    { name: 'Summon next (A)', value: 14, color: 'clubs', isMagicCard: true },
    // Diamonds
    { name: 'Start Over (2)', value: 2, color: 'diamonds', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'diamonds' },
    { name: '4', value: 4, color: 'diamonds' },
    { name: '5', value: 5, color: 'diamonds' },
    { name: '6', value: 6, color: 'diamonds' },
    { name: '7', value: 7, color: 'diamonds' },
    { name: 'Mirror (8)', value: 0, color: 'diamonds', isMagicCard: true },
    { name: 'You lose (9)', value: 9, color: 'diamonds', isTeaseCard: true },
    { name: 'Clear all (10)', value: 10, color: 'diamonds', isMagicCard: true },
    { name: 'J', value: 11, color: 'diamonds' },
    { name: 'Q', value: 12, color: 'diamonds' },
    { name: 'K', value: 13, color: 'diamonds' },
    { name: 'Summon next (A)', value: 14, color: 'diamonds', isMagicCard: true },
    // Hearts
    { name: 'Start Over (2)', value: 2, color: 'hearts', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'hearts' },
    { name: '4', value: 4, color: 'hearts' },
    { name: '5', value: 5, color: 'hearts' },
    { name: '6', value: 6, color: 'hearts' },
    { name: '7', value: 7, color: 'hearts' },
    { name: 'Mirror (8)', value: 0, color: 'hearts', isMagicCard: true },
    { name: 'You lose (9)', value: 9, color: 'hearts', isTeaseCard: true },
    { name: 'Clear all (10)', value: 10, color: 'hearts', isMagicCard: true },
    { name: 'J', value: 11, color: 'hearts' },
    { name: 'Q', value: 12, color: 'hearts' },
    { name: 'K', value: 13, color: 'hearts' },
    { name: 'Summon next (A)', value: 14, color: 'hearts', isMagicCard: true },
    // Spades
    { name: 'Start Over (2)', value: 2, color: 'spades', isMagicCard: true }, // value itt hogy legyen?
    { name: '3', value: 3, color: 'spades' },
    { name: '4', value: 4, color: 'spades' },
    { name: '5', value: 5, color: 'spades' },
    { name: '6', value: 6, color: 'spades' },
    { name: '7', value: 7, color: 'spades' },
    { name: 'Mirror (8)', value: 0, color: 'spades', isMagicCard: true },
    { name: 'You lose (9)', value: 9, color: 'spades', isTeaseCard: true },
    { name: 'Clear all (10)', value: 10, color: 'spades', isMagicCard: true },
    { name: 'J', value: 11, color: 'spades' },
    { name: 'Q', value: 12, color: 'spades' },
    { name: 'K', value: 13, color: 'spades' },
    { name: 'Summon next (A)', value: 14, color: 'spades', isMagicCard: true },
];

export const shuffleDeck = deck => [...deck].sort(() => Math.random() - 0.5);

const gameCards = {
    userCards: {
        table: [
            { name: '5', value: 5, color: 'spades' },
            { name: '6', value: 6, color: 'spades' },
            { name: '7', value: 7, color: 'spades' },
        ],
        tableFlipped: [
            { name: 'J', value: 11, color: 'spades' },
            { name: 'Q', value: 12, color: 'spades' },
            { name: 'K', value: 13, color: 'spades' },
        ],
        hand: [
            { name: 'Q', value: 12, color: 'spades' },
            { name: 'K', value: 13, color: 'spades' },
            { name: 'Summon next (A)', value: 14, color: 'spades', isMagicCard: true },
        ],
    },
    opponents: {
        kiskutya: {
            table: 3,
            tableFlipped: [
                { name: 'J', value: 11, color: 'spades' },
                { name: 'Q', value: 12, color: 'spades' },
                { name: 'K', value: 13, color: 'spades' },
            ],
            hand: 3,
        },
    },
};

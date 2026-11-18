import { canLayCard } from '@dutch-pub/shared';
import { games, modifyRooms, roomsList } from './rooms.js';
import { modifyRoomMessages, roomMessages } from './chat.js';
import { identityError } from './socketAuth.js';

import db from './models/index.js';
const PlayedGame = db.played_game;

/**
 * Checks that `socket` is authenticated as `username`, plays in game `roomId` and that it
 * is their turn. Returns `{ error }` or `{ player }` (the server-side player state).
 */
const validateTurn = (socket, { roomId, username }) => {
    const authError = identityError(socket, username);
    if (authError) {
        return { error: authError };
    }
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
    return { player };
};

/**
 * Checks a `lay-card` request against the server-side game state.
 * Returns `{ error }` when the move must be rejected, otherwise `{ card }`: the server's own
 * copy of the card (so client-sent flags like isMagicCard are never trusted), or the
 * face-down table card index for a blind play. With `cards` (several cards laid together)
 * it returns `{ card, cards }`: the server's copies, one per requested card (two requests
 * for the same card need two copies, possible with two decks), all of the same value, the
 * first one fitting the pile.
 */
export const validateLayCard = (socket, { card, cards, roomId, username }) => {
    const { error, player } = validateTurn(socket, { roomId, username });
    if (error) {
        return { error };
    }
    const currentGame = games[roomId];

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
    if (Array.isArray(cards) && cards.length > 0) {
        const pool = [...playableCards];
        const serverCards = [];
        for (const requested of cards) {
            const i = requested ? pool.findIndex(own => own.value === requested.value && own.color === requested.color) : -1;
            if (i < 0) {
                return { error: "You don't have that card." };
            }
            serverCards.push(pool.splice(i, 1)[0]);
        }
        if (serverCards.some(own => own.value !== serverCards[0].value)) {
            return { error: 'Only cards of the same value can be laid together.' };
        }
        if (!canLayCard(serverCards[0], currentGame.laidCards)) {
            return { error: 'You cannot lay that card.' };
        }
        return { card: serverCards[0], cards: serverCards };
    }
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
            const currentRoom = roomsList[roomId];
            const currentGame = games[roomId];
            const userCards = currentGame.players[username].userCards;

            if (typeof validation.card === 'number') {
                // A face-down card, played blind: revealed now, it either fits the pile or the
                // player picks up the pile together with it.
                const blindCard = userCards.table[validation.card];
                userCards.table = userCards.table.filter((_, i) => i !== validation.card);
                if (!canLayCard(blindCard, currentGame.laidCards)) {
                    userCards.hand = [blindCard, ...(currentGame.laidCards ?? [])].sort((a, b) => a.value - b.value);
                    currentGame.laidCards = null;
                    setActivePlayerNext(currentGame.players, username);
                    sendUiDataToSocket(io, currentRoom, currentGame, 'cards-drawn');
                    return;
                }
                applyLay(currentGame, username, [blindCard], cardIndex, { fromTable: true });
            } else {
                applyLay(currentGame, username, validation.cards ?? [validation.card], cardIndex);
            }

            const won = userCards.hand.length === 0 && userCards.tableFlipped.length === 0 && userCards.table.length === 0;
            if (won) {
                const gameId = `game-${roomId}`;
                const { [roomId]: _won, ...rest } = roomsList;
                modifyRooms(rest);
                // The game is over: free it (the players' last view is sent below from `currentGame`).
                delete games[roomId];
                io.to(gameId).emit('game-won', username, roomsList);
                io.in(gameId).socketsLeave(gameId);
                const { [gameId]: _messages, ...restRoomMessages } = roomMessages;
                modifyRoomMessages(restRoomMessages);
            }

            sendUiDataToSocket(io, currentRoom, currentGame, 'card-laid');
            if (won) {
                await PlayedGame.create({
                    winner: username,
                    players: currentRoom.players.map(player => player.username).join(','),
                });
            }
        });

        socket.on('get-game-state', () => {
            socket.emit('game-state', buildGameState(socket.data.user?.username));
        });

        socket.on('draw-cards', ({ roomId, username }) => {
            const { error } = validateTurn(socket, { roomId, username });
            if (error) {
                console.log('DRAW CARDS REJECTED', error, roomId, username);
                socket.emit('action-rejected', error);
                return;
            }
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

/**
 * `from` without one copy of each of `cards` (same value and colour). With two decks a
 * player can hold two identical cards; only as many copies as were laid are removed.
 */
export const withoutCards = (from, cards) => {
    const rest = [...from];
    for (const card of cards) {
        const i = rest.findIndex(own => own.value === card.value && own.color === card.color);
        if (i >= 0) rest.splice(i, 1);
    }
    return rest;
};

/** How many cards on top of `pile` (top first) have the top card's value. */
const topRun = pile => {
    let count = 0;
    while (count < pile.length && pile[count].value === pile[0].value) count++;
    return count;
};

/**
 * Lays `cards` (one or several of the same value, already validated) for `username`:
 * removes them from their hand, or from their face-up cards once the hand is empty (unless
 * `fromTable`: a revealed face-down card, already removed), refills the hand to 3 from the
 * deck, then puts them on the pile one after the other (the last one on top). A 10, or four
 * of a kind on top of the pile, burns it and the same player goes again; otherwise the turn
 * passes on.
 */
export const applyLay = (game, username, cards, cardIndex = 0, { fromTable = false } = {}) => {
    const userCards = game.players[username].userCards;
    if (!fromTable) {
        if (userCards.hand.length !== 0) userCards.hand = withoutCards(userCards.hand, cards);
        else userCards.tableFlipped = withoutCards(userCards.tableFlipped, cards);
    }
    // New cards go where the laid one was (the client keeps the hand in its order).
    let at = Math.max(0, Math.min(Number.isInteger(cardIndex) ? cardIndex : 0, userCards.hand.length));
    while (userCards.hand.length < 3 && game.deck.length > 0) {
        userCards.hand.splice(at++, 0, game.deck.shift());
    }

    const pile = [...[...cards].reverse(), ...(game.laidCards ?? [])];
    if (cards[0].value === 10 || topRun(pile) >= 4) {
        game.burntCards = [...pile, ...(game.burntCards ?? [])];
        game.laidCards = null;
    } else {
        game.laidCards = pile;
        setActivePlayerNext(game.players, username);
    }
};

/**
 * What `username` may see of `game`: their own cards (face-down table cards only as a
 * count), opponents' card counts and face-up cards, the pile, the deck size and the turn.
 */
export const buildPlayerView = (room, game, username) => {
    const opponents = {};
    room.players.forEach(otherPlayer => {
        if (otherPlayer.username !== username) {
            const { userCards, active } = game.players[otherPlayer.username];
            opponents[otherPlayer.username] = {
                table: userCards.table.length,
                hand: userCards.hand.length,
                tableFlipped: [...userCards.tableFlipped],
                active,
            };
        }
    });
    const own = game.players[username];
    return {
        userCards: { ...own.userCards, table: own.userCards.table.length },
        opponents,
        laidCards: game.laidCards ? game.laidCards : null,
        burntCards: game.burntCards ? game.burntCards : null,
        deck: game.deck.length,
        active: own.active,
    };
};

export const sendUiDataToSocket = async (io, room, game, message, roomId) => {
    room.players.forEach(player => {
        io.to(player.socketId).emit(message, buildPlayerView(room, game, player.username), roomsList, roomId);
    });
};

/** The room `username` is in, as `[roomId, room]`, or undefined. */
const findRoomOf = username => {
    const entry = Object.entries(roomsList).find(([, room]) => room.players.some(player => player.username === username));
    return entry && [Number(entry[0]), entry[1]];
};

/**
 * Full state for one client, used to re-sync after a reconnect or when the app returns to
 * the foreground: all rooms, the user's room (if any), their view of its game (if
 * started) and the room's chat history.
 */
export const buildGameState = username => {
    const found = username ? findRoomOf(username) : undefined;
    if (!found) {
        return { roomId: null, game: null, rooms: roomsList, messages: [] };
    }
    const [roomId, room] = found;
    const game = room.inGame && games[roomId] ? buildPlayerView(room, games[roomId], username) : null;
    return { roomId, game, rooms: roomsList, messages: roomMessages[`game-${roomId}`] ?? [] };
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

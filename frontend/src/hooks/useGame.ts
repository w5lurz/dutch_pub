import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { initialState, updateGame } from '../app/gameSlice';
import { setToast } from '../app/generalSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setRooms } from '../app/roomsSlice';
import { RootState } from '../app/store';
import { Game, TCard, TRooms, User } from '../app/types';
import { setUser } from '../app/userSlice';
import { getFirstArrayItem, getSecondArrayItem } from '../utils/utilFunctions';
import { SocketContext } from './useApp';

export default function useGame() {
    const socket: Socket = useContext(SocketContext)!;

    let navigate = useNavigate();
    const dispatch = useAppDispatch();
    const laidCards = useAppSelector((state: RootState) => state.game.laidCards);
    const handCards = useAppSelector((state: RootState) => state.game.userCards.hand);
    const flippedCards = useAppSelector((state: RootState) => state.game.userCards.tableFlipped);
    const tableCards = useAppSelector((state: RootState) => state.game.userCards.table);
    const active = useAppSelector((state: RootState) => state.game.active);
    const currentGame = useAppSelector((state: RootState) => state.game);
    const user = useAppSelector((state: RootState) => state.user);
    const roomId = user?.inGame as number;

    useEffect(() => {
        const cardLaidListener = (game: Game) => {
            dispatch(updateGame(game));
        };

        const cardsDrawnListener = (game: Game) => {
            dispatch(updateGame(game));
        };

        const gameWonListener = (username: string, roomsList: TRooms) => {
            dispatch(
                setToast({
                    id: `game-${roomId}-ended`, // TODO ez nem bizti jo lesz
                    type: 'success',
                    message: `${username === user?.username ? 'You' : username} won the game! Congratulations!`,
                    duration: 3000,
                    position: 'topCenter',
                }),
            );
            setTimeout(() => {
                dispatch(setRooms(roomsList));
                dispatch(updateGame(initialState));
                dispatch(setUser({ ...user, inGame: undefined } as User));
                navigate('/leaderboard');
            }, 3000);
        };

        socket.on('card-laid', cardLaidListener);
        socket.on('cards-drawn', cardsDrawnListener);
        socket.on('game-won', gameWonListener);

        const userDisconnectedListener = () => console.log('Socket disconnecting...', user, roomId);
        const userConnectedListener = () => {
            console.log('Socket connecting...', user, roomId);
            if (socket.recovered) {
                console.log('Socket RECOVERED...', socket);
            }
        };
        const userReconnectedListener = () => console.log('Reconnecting...', user, roomId);
        socket.on('disconnect', userDisconnectedListener);
        socket.on('connect', userConnectedListener);
        socket.on('reconnect', userReconnectedListener);

        return () => {
            socket.off('card-laid', cardLaidListener);
            socket.off('cards-drawn', cardsDrawnListener);
            socket.off('game-won', gameWonListener);
            socket.off('disconnect', userDisconnectedListener);
            socket.off('connect', userConnectedListener);
            socket.off('reconnect', userReconnectedListener);
        };
    }, []);

    useEffect(() => {
        const currentLaidCards = laidCards;
        const lastLaidCard = currentLaidCards ? getFirstArrayItem(currentLaidCards) : null;
        let canLayCard = false;
        if (handCards?.length === 0 && flippedCards?.length === 0 && tableCards) {
            canLayCard = true;
        } else {
            const cardsToCheck = handCards && handCards.length > 0 ? handCards : flippedCards;
            cardsToCheck.forEach((card: TCard) => {
                canLayCard =
                    canLayCard ||
                    !currentLaidCards ||
                    (lastLaidCard?.value <= card.value &&
                        ((!lastLaidCard?.isMagicCard && !lastLaidCard?.isTeaseCard) ||
                            (lastLaidCard?.isMagicCard && lastLaidCard?.value === 2))) ||
                    (currentLaidCards && !lastLaidCard?.isTeaseCard && card.isMagicCard) ||
                    (currentLaidCards && lastLaidCard?.isMagicCard && lastLaidCard?.value === 14 && card.isMagicCard) ||
                    (currentLaidCards &&
                        lastLaidCard?.isMagicCard &&
                        lastLaidCard?.value === 0 &&
                        (getSecondArrayItem(currentLaidCards).value <= card.value || !getSecondArrayItem(currentLaidCards))) ||
                    (currentLaidCards && lastLaidCard?.isMagicCard && lastLaidCard?.value === 2 && lastLaidCard?.value <= card.value) ||
                    (currentLaidCards && lastLaidCard?.isTeaseCard && card.value >= 3 && card.value <= 7);
            });
        }
        if (!canLayCard && active) {
            socket.emit('draw-cards', { roomId, username: user?.username });
        }
    }, [laidCards, handCards, active]);

    return { currentGame, active, user, roomId };
}

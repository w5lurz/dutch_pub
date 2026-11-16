import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initialState, updateGame } from '../app/gameSlice';
import { setToast } from '../app/generalSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setRooms } from '../app/roomsSlice';
import { RootState } from '../app/store';
import { hasAnyPlayableCard } from '@dutch-pub/shared';
import { Game, TRooms, User } from '../app/types';
import { setUser } from '../app/userSlice';
import { SocketContext } from './useApp';

export default function useGame() {
    const socket = useContext(SocketContext)!;

    let navigate = useNavigate();
    const dispatch = useAppDispatch();
    const laidCards = useAppSelector((state: RootState) => state.game.laidCards);
    const handCards = useAppSelector((state: RootState) => state.game.userCards.hand);
    const flippedCards = useAppSelector((state: RootState) => state.game.userCards.tableFlipped);
    const tableCards = useAppSelector((state: RootState) => state.game.userCards.table);
    const active = useAppSelector((state: RootState) => state.game.active);
    const testGame = useAppSelector((state: RootState) => state.game);
    const user = useAppSelector((state: RootState) => state.user);
    const roomId = user?.inGame as number;

    useEffect(() => {
        const cardLaidListener = (game: Game) => {
            dispatch(updateGame(game)); // TODO add toast?
        };

        const cardsDrawnListener = (game: Game) => {
            dispatch(updateGame(game)); // TODO ADD sad toast
        };

        const gameWonListener = (username: string, roomsList: TRooms) => {
            console.log('GAME WON', username);
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

        const layCardRejectedListener = (reason: string) => {
            dispatch(setToast({ id: 'lay-card-rejected', type: 'sad', message: reason, duration: 3000 }));
        };

        socket.on('card-laid', cardLaidListener);
        socket.on('cards-drawn', cardsDrawnListener);
        socket.on('game-won', gameWonListener);
        socket.on('lay-card-rejected', layCardRejectedListener);

        // DISCONNECTNEL is megvannak ezek
        const userDisconnectedListener = () => console.log('Socket disconnecting...', user, roomId);
        // CONNECTNEL is megvannak ezek
        const userConnectedListener = () => {
            console.log('Socket connecting...', user, roomId);
            if (socket.recovered) {
                console.log('Socket RECOVERED...', socket);
            }
        };
        const userReconnectedListener = () => console.log('Reconnecting...', user, roomId);
        socket.on('disconnect', userDisconnectedListener);
        socket.on('connect', userConnectedListener);
        socket.io.on('reconnect', userReconnectedListener);
        return () => {
            socket.off('card-laid', cardLaidListener);
            socket.off('cards-drawn', cardsDrawnListener);
            socket.off('game-won', gameWonListener);
            socket.off('lay-card-rejected', layCardRejectedListener);
            socket.off('disconnect', userDisconnectedListener);
            socket.off('connect', userConnectedListener);
            socket.io.off('reconnect', userReconnectedListener);
        };
    }, []);

    useEffect(() => {
        const canLayAnyCard = hasAnyPlayableCard({ hand: handCards, tableFlipped: flippedCards, table: tableCards }, laidCards);
        if (!canLayAnyCard && active) {
            // todo FELHUZTAL LAPOKAT
            console.log('DRAWINGCARD', roomId, user?.username);
            socket.emit('draw-cards', { roomId, username: user?.username });
        }
    }, [laidCards, handCards, active]);

    return { testGame, active, user, roomId };
}


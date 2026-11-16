import { useCallback, useContext } from 'react';
import { canLayCard } from '@dutch-pub/shared';
import { setToast } from '../app/generalSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { RootState } from '../app/store';
import { TCard, User } from '../app/types';
import { SocketContext } from './useApp';

export default function useCard(roomId: number, user: User) {
    const socket = useContext(SocketContext)!;

    const dispatch = useAppDispatch();
    const laidCards = useAppSelector((state: RootState) => state.game.laidCards);

    const handleCardOnClick = (card: TCard | number, cardIndex: number, roomId: number, user: User) => {
        if (canLayCard(card, laidCards)) {
            console.log('LAYING CARD', card, user?.username);
            socket.emit('lay-card', { card, cardIndex, roomId, username: user?.username });
        } else {
            dispatch(setToast({ id: 'lay-card-failed', type: 'sad', message: 'You cannot lay that card.', duration: 3000 }));
        }
    };

    const addWarningToast = useCallback(() => {
        dispatch(setToast({ id: 'place-card-failed', type: 'warning', message: 'You cannot place that card!', duration: 3000 }));
    }, []);

    return { handleCardOnClick, addWarningToast };
}

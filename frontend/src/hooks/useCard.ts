import { useCallback, useContext, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { setToast } from '../app/generalSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { RootState } from '../app/store';
import { TCard, User } from '../app/types';
import { getFirstArrayItem, getSecondArrayItem } from '../components/util/utilFunctions';
import { SocketContext } from './useApp';

export default function useCard(roomId: number, user: User) {
    const socket: Socket = useContext(SocketContext)!;

    const dispatch = useAppDispatch();
    const laidCards = useAppSelector((state: RootState) => state.game.laidCards);

    const handleCardOnClick = (card: TCard | number, cardIndex: number, roomId: number, user: User) => {
        const lastLaidCard = laidCards ? getFirstArrayItem(laidCards) : null;
        // TODO move to util
        let canLayCard = false;
        console.log('HANDLE', canLayCard);
        if (typeof card === 'number') {
            console.log('HANDLE1', canLayCard);
            canLayCard = true;
        } else {
            canLayCard =
                !laidCards ||
                (lastLaidCard.value <= card.value && !lastLaidCard.isMagicCard && !lastLaidCard.isTeaseCard) ||
                (laidCards && !lastLaidCard.isTeaseCard && card.isMagicCard) ||
                (laidCards && lastLaidCard.isMagicCard && lastLaidCard.value === 14 && card.isMagicCard) ||
                (laidCards &&
                    lastLaidCard.isMagicCard &&
                    lastLaidCard.value === 0 &&
                    (getSecondArrayItem(laidCards).value <= card.value || !getSecondArrayItem(laidCards))) ||
                (laidCards && lastLaidCard.isMagicCard && lastLaidCard.value === 2 && lastLaidCard.value <= card.value) ||
                (laidCards && lastLaidCard.isTeaseCard && card.value >= 3 && card.value <= 7);
            console.log('HANDLE2', canLayCard);
        }
        console.log('HANDLE3', canLayCard);
        if (canLayCard) {
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

/* console.log(
            'CARD CLICKED',
            card,
            laidCards,
            lastLaidCard,
            // getSecondArrayItem(laidCards!),
            lastLaidCard && lastLaidCard.value <= card.value && !lastLaidCard.isMagicCard,
            laidCards && !lastLaidCard.isTeaseCard && card.isMagicCard,
            laidCards && lastLaidCard.isMagicCard && lastLaidCard.value === 14 && card.isMagicCard,
            laidCards &&
                lastLaidCard.isMagicCard &&
                lastLaidCard.value === 0 &&
                (getSecondArrayItem(laidCards).value <= card.value || !getSecondArrayItem(laidCards)),
            laidCards && lastLaidCard.isMagicCard && lastLaidCard.value === 2 && lastLaidCard.value <= card.value,
            laidCards && lastLaidCard.isTeaseCard && card.value >= 3 && card.value <= 7,
        ); */

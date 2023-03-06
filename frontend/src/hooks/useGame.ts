import { useContext, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { updateGame } from '../app/gameSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { RootState } from '../app/store';
import { Game, TCard, User } from '../app/types';
import { getFirstArrayItem, getSecondArrayItem } from '../components/util/utilFunctions';
import { SocketContext } from './useApp';

export default function useGame() {
    const socket: Socket = useContext(SocketContext)!;

    const dispatch = useAppDispatch();
    const laidCards = useAppSelector((state: RootState) => state.game.laidCards);
    const handCards = useAppSelector((state: RootState) => state.game.userCards.hand);
    const active = useAppSelector((state: RootState) => state.game.active);
    const testGame = useAppSelector((state: RootState) => state.game);
    const user = useAppSelector((state: RootState) => state.user);
    const roomId = user?.inGame as number;

    useEffect(() => {
        const cardLaidListener = (game: Game) => {
            dispatch(updateGame(game));
        };

        const cardsDrawnListener = (game: Game) => {
            dispatch(updateGame(game));
        };

        socket.on('card-laid', cardLaidListener);
        socket.on('cards-drawn', cardsDrawnListener);
    }, []);

    useEffect(() => {
        const currentLaidCards = laidCards;
        const lastLaidCard = currentLaidCards ? getFirstArrayItem(currentLaidCards) : null;
        let canLayCard = false;
        handCards.forEach((card: TCard) => {
            canLayCard =
                canLayCard ||
                !currentLaidCards ||
                (lastLaidCard.value <= card.value && !lastLaidCard.isMagicCard && !lastLaidCard.isTeaseCard) ||
                (currentLaidCards && !lastLaidCard.isTeaseCard && card.isMagicCard) ||
                (currentLaidCards && lastLaidCard.isMagicCard && lastLaidCard.value === 14 && card.isMagicCard) ||
                (currentLaidCards &&
                    lastLaidCard.isMagicCard &&
                    lastLaidCard.value === 0 &&
                    getSecondArrayItem(currentLaidCards).value <= card.value) ||
                (currentLaidCards && lastLaidCard.isMagicCard && lastLaidCard.value === 2 && lastLaidCard.value <= card.value) ||
                (currentLaidCards && lastLaidCard.isTeaseCard && card.value >= 3 && card.value <= 7);
        });
        if (!canLayCard && active) {
            console.log('DRAWINGCARD', roomId, user?.username);
            socket.emit('draw-cards', { roomId, username: user?.username });
        }
    }, [laidCards, handCards, active]);

    return { testGame, active, user, roomId };
}

/* console.log(
                'CAN LAY',
                card,
                lastLaidCard,
                canLayCard,
                !currentLaidCards,
                lastLaidCard && lastLaidCard.value <= card.value && !lastLaidCard.isMagicCard && !lastLaidCard.isTeaseCard,
                currentLaidCards && !lastLaidCard.isTeaseCard && card.isMagicCard,
                currentLaidCards && lastLaidCard.isMagicCard && lastLaidCard.value === 14 && card.isMagicCard,
                currentLaidCards &&
                    lastLaidCard.isMagicCard &&
                    lastLaidCard.value === 0 &&
                    getSecondArrayItem(currentLaidCards).value <= card.value,
                currentLaidCards && lastLaidCard.isMagicCard && lastLaidCard.value === 2 && lastLaidCard.value <= card.value,
                currentLaidCards && lastLaidCard.isTeaseCard && card.value >= 3 && card.value <= 7,
            ); */

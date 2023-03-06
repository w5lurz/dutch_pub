import { TCard, User } from '../../../app/types';
import { CardBackSide, CardIcon } from '../../util/UtilComponents';
import useCard from '../../../hooks/useCard';

type CardProps = {
    card: TCard | number | null;
    active?: boolean;
    i: number;
    roomId: number;
    user: User;
    canTouch?: boolean;
    isHandCard?: boolean;
};

export default function Card({ card, active, i, roomId, user, canTouch = true, isHandCard = false }: CardProps) {
    const { handleCardOnClick } = useCard(roomId, user);

    if (typeof card === 'number') {
        // -ml-4
        return (
            <div className={canTouch ? 'hover:cursor-pointer hover:bg-blue-50' : ''}>
                <CardBackSide />
            </div>
        ); // <div className={'flex flex-col -m-2 bg-gray-600 shadow-md rounded p-2 w-24 h-32 gap-2'}></div>;
    }
    if (card === null) {
        return null;
    }
    return (
        <div
            className={`${canTouch && active ? 'hover:cursor-pointer hover:bg-blue-50' : ''}${
                !active ? 'cursor-not-allowed' : ''
            } -m-2 flex flex-col rounded bg-gray-50 shadow-md p-2 w-24 h-32 gap-2`}
            onClick={() => canTouch && active && handleCardOnClick(card as TCard, i, roomId, user)}
        >
            <div className="flex flex-col justify-start items-center">
                <p className="text-sm">{card.value}</p>
                {CardIcon(card.color)}
            </div>
            <div className="text-sm flex flex-col justify-start items-center">{card.name}</div>
            <div className="text-xs flex flex-col justify-start items-center">{card.color}</div>
        </div>
    );
}

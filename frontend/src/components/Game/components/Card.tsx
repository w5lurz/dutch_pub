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
    writePlus?: boolean;
};

export default function Card({ card, active, i, roomId, user, canTouch = false, writePlus = false }: CardProps) {
    const { handleCardOnClick, addWarningToast } = useCard(roomId, user);

    if (typeof card === 'number') {
        return (
            <div
                className={canTouch ? 'hover:cursor-pointer hover:bg-blue-50' : ''}
                onClick={() => {
                    if (canTouch && active) {
                        handleCardOnClick(card as number, i, roomId, user);
                    } else {
                        addWarningToast();
                    }
                }}
            >
                {writePlus && i !== 0 && <p className="flex justify-center items-center w-14 h-24 absolute text-white">+{i}</p>}
                <CardBackSide />
            </div>
        );
    }
    if (card === null) {
        return null;
    }
    return (
        <div
            className={`${canTouch && active ? 'hover:cursor-pointer hover:bg-blue-50' : ''}${
                !active ? 'cursor-not-allowed' : ''
            } -m-2 flex flex-col rounded bg-gray-50 shadow-md p-2 w-20 h-28 gap-2`}
            onClick={() => {
                if (canTouch && active) {
                    handleCardOnClick(card as TCard, i, roomId, user);
                } else {
                    addWarningToast();
                }
            }}
        >
            <div className="flex flex-col justify-start items-center">
                <p className="text-sm">{card.value}</p>
                {CardIcon(card.color)}
            </div>
            <div className="text-xs flex flex-col justify-start items-center">{card.name}</div>
            <div className="text-xs flex flex-col justify-start items-center">{card.color}</div>
        </div>
    );
}

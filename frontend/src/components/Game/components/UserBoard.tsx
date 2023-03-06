import { TCard, User, UserCards } from '../../../app/types';
import { renderFlippedCards } from '../../util/UtilComponents';
import Card from './Card';

type UserBoardProps = { userCards: UserCards; active?: boolean; user: User; roomId: number };

export default function UserBoard({ userCards, active, user, roomId }: UserBoardProps) {
    return (
        <div className="flex flex-col">
            <div className="px-6 pt-6 flex justify-center">
                {userCards.hand.map((card: TCard, i: number) => {
                    return <Card key={`${card.color}-${card.value}`} card={card} active={active} i={i} user={user} roomId={roomId} />;
                })}
            </div>
            <h6 className={`${active ? 'bg-green-200 rounded-md px-2' : ''} flex text-lg font-semibold self-center mt-4`}>
                {user?.username}
            </h6>
            <div className="p-6 flex z-10 justify-center">
                {userCards.tableFlipped.map((card: TCard, i: number) => {
                    return (
                        <Card
                            key={`${card.color}-${card.value}`}
                            card={card}
                            active={active}
                            i={i}
                            user={user}
                            roomId={roomId}
                            canTouch={false}
                        />
                    );
                })}
            </div>
            <div className="p-6 -mt-36 z-0 flex justify-center">{renderFlippedCards(userCards.table, user, roomId)}</div>
        </div>
    );
}

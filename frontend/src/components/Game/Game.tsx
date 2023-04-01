import { TCard, Opponent } from '../../app/types';
import useGame from '../../hooks/useGame';
import { MessageToastsProvider } from '../../hooks/useMessageToast';
import { renderFlippedCards } from '../util/UtilComponents';
import Card from './components/Card';
import ChatInterface from './components/ChatInterface';
import UserBoard from './components/UserBoard';

export default function Game() {
    // sm:max-w-md
    const { testGame, active, user, roomId } = useGame();

    console.log('OPPONENTER', testGame);
    return (
        <div className="flex gap-4 bg-white shadow dark:border md:mt-0 xl:p-0 dark:bg-gray-800 dark:border-gray-700 h-full">
            <ChatInterface roomId={roomId} user={user} />
            <div className="flex flex-col grow h-full justify-between">
                <div className="flex justify-evenly">
                    {Object.entries(testGame.opponents).map(([key, opponent]: [string, Opponent]) => (
                        <div key={`opponent-${key}`} className="flex flex-col">
                            <h6
                                className={`${
                                    opponent.active ? 'bg-green-200 rounded-md px-2' : ''
                                } flex text-lg font-semibold self-center mt-4`}
                            >
                                {key}
                            </h6>
                            <div className="p-6 -mb-[8rem] z-0 flex justify-center">
                                {renderFlippedCards(opponent?.table, user, roomId)}
                            </div>
                            <div className="px-6 pt-6 flex z-10 justify-center">
                                {opponent?.tableFlipped.map((card: TCard, i: number) => {
                                    return (
                                        <Card
                                            key={`${card.color}-${card.value}`}
                                            card={card}
                                            active={opponent.active}
                                            i={i}
                                            user={user}
                                            roomId={roomId}
                                        />
                                    );
                                })}
                            </div>
                            <div className="p-6 z-10 flex justify-center -mt-16">{renderFlippedCards(opponent?.hand, user, roomId)}</div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center gap-6">
                    <div className="flex flex-col items-center">
                        <h6 className="mb-2 font-bold">Deck ({testGame.deck})</h6>
                        <Card card={testGame.deck} active={active} i={0} user={user} roomId={roomId} />
                    </div>
                    <div className="flex flex-col items-center">
                        <h6 className="mb-2 font-bold">Laid Cards</h6>
                        <Card card={testGame.laidCards ? testGame.laidCards[0] : null} active={active} i={0} user={user} roomId={roomId} />
                    </div>
                    <div className="flex flex-col items-center">
                        <h6 className="mb-2 font-bold">Burnt Cards</h6>
                        <Card
                            card={testGame.burntCards ? testGame.burntCards[0] : null}
                            active={active}
                            i={0}
                            user={user}
                            roomId={roomId}
                        />
                    </div>
                </div>
                <UserBoard userCards={testGame.userCards} active={active} user={user} roomId={roomId} />
            </div>
        </div>
    );
}

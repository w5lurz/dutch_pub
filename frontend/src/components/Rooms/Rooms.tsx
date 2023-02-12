import { TRooms } from '../../app/types';

export default function Rooms() {
    const rooms: TRooms = {
        1: {
            name: 'First Room',
            owner: 'kiskutya',
            players: ['kiskutya', 'kiscica', 'hehe'],
            slots: 4,
        },
        2: {
            name: 'Second Room',
            owner: 'kiscica',
            players: ['kiscica'],
            slots: 4,
        },
        3: {
            name: 'Kiskutya jatszo',
            owner: 'Tamas',
            players: ['Tamas', 'Julci'],
            slots: 2,
        },
    };
    return (
        <div className="bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0 gap-4">
                {Object.entries(rooms).map(([key, value]: [string, any]) => {
                    const { name, owner, players, slots } = value;
                    return (
                        <div
                            key={key}
                            className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700"
                        >
                            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                                <div>
                                    <div className="flex justify-between">
                                        <h5 className="text-xl">Room name: {name}</h5>
                                        {players.length < slots && (
                                            <button
                                                className="p-0.5 px-2 bg-green-300 rounded-md border-2 border-green-500 hover:bg-green-500 hover:border-green-300 dark:border"
                                                onClick={() => console.log(`JOIN CLICKED - ${key}`)}
                                            >
                                                Join
                                            </button>
                                        )}
                                    </div>
                                    <h6 className="text-sm">Owner: {owner}</h6>
                                </div>
                                <h6>Players: {players.join(', ')}</h6>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

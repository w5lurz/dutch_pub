import { TRoom } from '../../app/types';
import useRooms from '../../hooks/useRooms';
import Button from '../util/Button';
import CreateRoomForm from './CreateRoomForm';

export default function Rooms() {
    const { rooms, user, isInAnyRoom, currentRoom, isAlreadyOwner, handleDeleteRoom, handleJoinRoom, handleLeaveRoom } = useRooms();
    console.log('CLIENT ROOMS', rooms, currentRoom);

    return (
        <div className="bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-auto lg:py-8 gap-4">
                {Object.entries(rooms).map(([key, value]: [string, TRoom]) => {
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
                                        <div className="flex gap-2">
                                            {players.length < slots && !isInAnyRoom && (
                                                <Button
                                                    label="Join"
                                                    color="green"
                                                    handleOnClick={() => handleJoinRoom(user?.username ?? 'NO USERNAME', +key)}
                                                />
                                            )}
                                            {currentRoom && currentRoom?.name === name && owner !== user?.username && (
                                                <Button
                                                    label="Leave"
                                                    color="yellow"
                                                    handleOnClick={() => handleLeaveRoom(user?.username ?? 'NO USERNAME', +key)}
                                                />
                                            )}
                                            {owner === user?.username && (
                                                <Button label="Delete" color="red" handleOnClick={() => handleDeleteRoom(+key)} />
                                            )}
                                            {owner === user?.username && (
                                                <Button label="Start" color="blue" handleOnClick={() => handleDeleteRoom(+key)} />
                                            )}
                                        </div>
                                    </div>
                                    <h6 className="text-sm">Owner: {owner}</h6>
                                </div>
                                <h6>Players: {players.join(', ')}</h6>
                            </div>
                        </div>
                    );
                })}
                <CreateRoomForm key="create-room-form" user={user} isAlreadyOwner={!!isAlreadyOwner} />
            </div>
        </div>
    );
}

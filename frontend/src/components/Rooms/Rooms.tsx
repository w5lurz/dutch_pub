import { Player, TRoom } from '../../app/types';
import useRooms from '../../hooks/useRooms';
import Button from '../util/Button';
import CreateRoomForm from './CreateRoomForm';
import LoginAsGuestForm from './LoginAsGuestForm';

export default function Rooms() {
    const { rooms, user, isInAnyRoom, currentRoom, isAlreadyOwner, handleDeleteRoom, handleJoinRoom, handleLeaveRoom, handleStartRoom } =
        useRooms();
    console.log('CLIENT ROOMS', rooms, currentRoom, isInAnyRoom, isAlreadyOwner);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 dark:text-white h-full">
            {user === null ? (
                <LoginAsGuestForm />
            ) : (
                <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-auto lg:py-8 gap-4">
                    {Object.keys(rooms).length !== 0 ? (
                        Object.entries(rooms).map(([key, value]: [string, TRoom]) => {
                            const { name, owner, players, slots, inGame = false, isPrivate = false } = value;
                            return (
                                <div
                                    key={key}
                                    className={`w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700 ${
                                        inGame ? 'cursor-not-allowed' : ''
                                    }`}
                                >
                                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                                        <div>
                                            <div className="flex justify-between">
                                                <h5 className="text-xl">Room name: {name}</h5>
                                                <div className="flex gap-2">
                                                    {players.length < slots &&
                                                        !isInAnyRoom &&
                                                        ((isPrivate && !user.isGuest) || !isPrivate) && (
                                                            <Button
                                                                label="Join"
                                                                color="green"
                                                                handleOnClick={() =>
                                                                    handleJoinRoom(user?.username ?? 'NO USERNAME', +key, name)
                                                                }
                                                            />
                                                        )}
                                                    {currentRoom && currentRoom?.name === name && owner !== user?.username && (
                                                        <Button
                                                            label="Leave"
                                                            color="yellow"
                                                            handleOnClick={() =>
                                                                handleLeaveRoom(user?.username ?? 'NO USERNAME', +key, name)
                                                            }
                                                        />
                                                    )}
                                                    {owner === user?.username && (
                                                        <Button
                                                            label="Delete"
                                                            color="red"
                                                            handleOnClick={() => handleDeleteRoom(+key, name)}
                                                        />
                                                    )}
                                                    {owner === user?.username && players.length > 1 && (
                                                        <Button
                                                            label="Start"
                                                            color="blue"
                                                            handleOnClick={() => handleStartRoom(+key, name)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <h6 className="text-sm">Owner: {owner}</h6>
                                        </div>
                                        <h6>
                                            Players: {players.map((player: Player) => player.username).join(', ')} ({players.length}/{slots}
                                            )
                                        </h6>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <>
                            <h2 className="text-lg">No Room created yet!</h2>
                            <p className="text-base">
                                You can create a new room by clicking on the Create room button - however if you cannot see it you may had
                                not logged in yet.
                            </p>
                        </>
                    )}
                    <CreateRoomForm key="create-room-form" user={user} isAlreadyOwner={!!isAlreadyOwner} isInAnyRoom={isInAnyRoom} />
                </div>
            )}
        </div>
    );
}

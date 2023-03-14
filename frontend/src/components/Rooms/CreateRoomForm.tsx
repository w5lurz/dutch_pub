import { User } from '../../app/types';
import useCreateRoomForm from '../../hooks/useCreateRoomForm';
import Button from '../util/Button';

type CreateRoomFormProps = {
    user?: User;
    isAlreadyOwner?: boolean;
    isInAnyRoom?: boolean;
};

export default function CreateRoomForm({ user, isAlreadyOwner = false, isInAnyRoom = false }: CreateRoomFormProps) {
    const { isCreateRoomVisible, setIsCreateRoomVisible, handleCreateRoom } = useCreateRoomForm(user);

    if (isCreateRoomVisible && user) {
        return (
            <form className="space-y-4 md:space-y-6" onSubmit={handleCreateRoom}>
                <div>
                    <label htmlFor="roomname" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Room Name
                    </label>
                    <input
                        type="text"
                        name="roomname"
                        id="roomname"
                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="random room name"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="slots" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Slots
                    </label>
                    <input
                        type="number"
                        name="slots"
                        id="slots"
                        min={2}
                        max={4}
                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                    Create Room
                </button>
            </form>
        );
    }
    // TODO check smthg else like isLoggedIn --> not logged in user also has an object
    if (user?.email && !isAlreadyOwner && !isInAnyRoom) {
        return <Button label="Create room" handleOnClick={() => setIsCreateRoomVisible(true)} />;
    }
    return null;
}

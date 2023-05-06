import { FormEvent, useContext, useState } from 'react';
import { Socket } from 'socket.io-client';
import { setToast } from '../app/generalSlice';
import { useAppDispatch } from '../app/hooks';
import { User } from '../app/types';
import { SocketContext } from './useApp';

export default function useCreateRoomForm(user?: User) {
    const socket: Socket = useContext(SocketContext)!;
    const [isCreateRoomVisible, setIsCreateRoomVisible] = useState<boolean>(false);

    const dispatch = useAppDispatch();

    const handleCreateRoom = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        const name = data.get('roomname') as string;
        const slots = +(data.get('slots') as string);
        const visibility = data.get('visibility') as string;
        console.log('CREATE ROOM', user);
        socket.emit('create-room', { name, owner: user?.username || 'NOT LOGGED IN', slots, visibility });
        event.currentTarget.reset();
        setIsCreateRoomVisible(false);
        dispatch(
            setToast({
                id: `create-room-${name}-success`,
                type: 'success',
                message: `You successfully created Room ${name}!`,
                duration: 3000,
            }),
        );
    };

    return { isCreateRoomVisible, setIsCreateRoomVisible, handleCreateRoom };
}

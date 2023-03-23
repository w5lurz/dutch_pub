import { FormEvent, useContext, useState } from 'react';
import { Socket } from 'socket.io-client';
import { User } from '../app/types';
import { SocketContext } from './useApp';

export default function useCreateRoomForm(user?: User) {
    const socket: Socket = useContext(SocketContext)!;
    const [isCreateRoomVisible, setIsCreateRoomVisible] = useState<boolean>(false);

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
    };

    return { isCreateRoomVisible, setIsCreateRoomVisible, handleCreateRoom };
}

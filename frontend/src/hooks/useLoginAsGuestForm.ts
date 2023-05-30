import { FormEvent, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { addGuest } from '../app/api';
import { setToast } from '../app/generalSlice';
import { useAppDispatch } from '../app/hooks';
import { setUser } from '../app/userSlice';
import { SocketContext } from './useApp';

export default function useLoginAsGuestForm() {
    const socket: Socket = useContext(SocketContext)!;

    const [socketId, setSocketId] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const dispatch = useAppDispatch();
    useEffect(() => {
        socket.emit('get-socketid');
        socket.on('got-socketid', socketId => {
            setSocketId(socketId);
        });
        return () => {
            socket.off('got-socketid');
        };
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const data = new FormData(event.currentTarget);
        const guestUsername = data.get('guest-username') as string;
        setLoading(true);
        try {
            const response = await addGuest(guestUsername, socketId);
            if (response.status === 200) {
                const guestData = await response.json();
                dispatch(
                    setUser({
                        id: guestData.id,
                        username: guestData.username,
                        socketId: guestData.socketId,
                        isGuest: guestData.isGuest,
                    }),
                );
                dispatch(setToast({ id: 'add-guest-success', type: 'success', message: 'Your Guest account added!', duration: 3000 }));
            } else {
                const guestData = await response.json();
                console.error('Error while adding Guest ', guestData?.message);
                dispatch(setToast({ id: 'add-guest-failed', type: 'error', message: guestData?.message, duration: 3000 }));
            }
        } catch (e: any) {
            console.error('Error while adding Guest ', e.toString());
            dispatch(setToast({ id: 'add-guest-failed', type: 'error', message: 'Cannot add Guest!', duration: 3000 }));
        }
        setLoading(false);
    };

    return { loading, handleSubmit };
}

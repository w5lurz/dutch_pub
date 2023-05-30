import { createContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getUser } from '../app/api';
import { useAppDispatch } from '../app/hooks';
import { setUser } from '../app/userSlice';

export const SocketContext = createContext(null);

export default function useApp() {
    const dispatch = useAppDispatch();
    const [socket, setSocket] = useState<any>(null);

    useEffect(() => {
        (async () => {
            try {
                const response = await getUser();
                const userData = await response.json();
                if (userData?.id) {
                    dispatch(setUser(userData));
                }
            } catch (e: any) {
                console.error(e.toString());
            }
        })();
        const newSocket: Socket = io(process.env.REACT_APP_BASE_URL ?? 'http://localhost:3030', { withCredentials: true });
        newSocket.emit('test');
        setSocket(newSocket);

        return () => {
            console.log('Closing socket connection..');
            newSocket.close();
        };
    }, []);

    return { socket };
}

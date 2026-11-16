import { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AppSocket } from '../app/types';
import { getUser } from '../app/api';
import { useAppDispatch } from '../app/hooks';
// import { setSocket } from '../app/socketSlice';
import { RootState } from '../app/store';
import { setUser } from '../app/userSlice';
import { setToast } from '../app/generalSlice';
import { isDevEnv } from '../utils/config';

export const SocketContext = createContext<AppSocket | null>(null);

/**
 * The server identifies a socket once, at connect time, from the session cookie. Call this
 * after login, logout or joining as a guest so the socket picks up the new identity.
 * Listeners registered on the socket survive the reconnect.
 */
export const reconnectSocket = (socket: AppSocket | null) => {
    socket?.disconnect();
    socket?.connect();
};

export default function useApp() {
    const dispatch = useAppDispatch();
    const [socket, setSocket] = useState<AppSocket | null>(null);
    // const socket = useSelector((state: RootState) => state.socket);
    console.log(socket);
    useEffect(() => {
        (async () => {
            try {
                // TODO 403 still stays in try
                const response = await getUser();
                const userData = await response.json();
                if (userData?.id) {
                    dispatch(setUser(userData));
                }
            } catch (e: any) {
                console.error(e.toString());
            }
        })();
        const newSocket: AppSocket = io(process.env.REACT_APP_BASE_URL ?? 'http://localhost:3030', { withCredentials: true });
        console.log('SOCKET', socket);
        newSocket.on('action-rejected', (reason: string) => {
            dispatch(setToast({ id: `action-rejected-${Date.now()}`, type: 'sad', message: reason, duration: 3000 }));
        });
        // dispatch(setSocket(newSocket));
        setSocket(newSocket);

        return () => {
            console.log('Closing socket connection..');
            newSocket.close();
        };
    }, []);

    return { socket };
}

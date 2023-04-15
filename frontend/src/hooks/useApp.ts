import { createContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getUser } from '../app/api';
import { useAppDispatch } from '../app/hooks';
// import { setSocket } from '../app/socketSlice';
import { RootState } from '../app/store';
import { setUser } from '../app/userSlice';
import { isDevEnv } from '../utils/config';

export const SocketContext = createContext(null);

export default function useApp() {
    const dispatch = useAppDispatch();
    const [socket, setSocket] = useState<any>(null);
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
        const newSocket: Socket = io(process.env.REACT_APP_BASE_URL ?? 'http://localhost:3030', { withCredentials: true });
        console.log('SOCKET', socket);
        newSocket.emit('test');
        // dispatch(setSocket(newSocket));
        setSocket(newSocket);

        return () => {
            console.log('Closing socket connection..');
            newSocket.close();
        };
    }, []);

    return { socket };
}

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';

import { clearToken, getToken } from '@/lib/authToken';
import { API_URL } from '@/lib/config';
import type { AppSocket } from '@/lib/types';
import { setToast } from '@/store/generalSlice';
import { setUser } from '@/store/userSlice';
import { useAppDispatch } from '@/store';

type SocketContextValue = {
    socket: AppSocket;
    connected: boolean;
    /** Reconnects so the server sees the current token (call after login / logout / join as guest). */
    reconnect: () => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * Owns the app's single Socket.io connection. The server identifies the socket once, at
 * connect time, from `auth.token`; the `auth` callback reads the stored token on every
 * (re)connect.
 * TODO (PLAN.md Step 4): reconnect / re-sync state when the app returns to the foreground.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
    const dispatch = useAppDispatch();

    // Created once; connected/closed by the effect (safe with StrictMode's double effects).
    // Native has no CORS / cookie constraints; plain WebSocket avoids long-polling.
    const [socket] = useState<AppSocket>(() =>
        io(API_URL, {
            transports: ['websocket'],
            autoConnect: false,
            auth: callback => {
                getToken()
                    .then(token => callback(token ? { token } : {}))
                    .catch(() => callback({}));
            },
        }),
    );
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        const onConnectError = async (error: Error) => {
            if (error.message === 'unauthorized' || error.message === 'username taken') {
                // Stored token is expired/invalid (or a guest name got taken): drop it and
                // continue anonymously.
                await clearToken();
                dispatch(setUser(null));
                dispatch(setToast({ id: `session-${Date.now()}`, type: 'info', message: 'Please log in again.', duration: 3000 }));
                socket.connect();
            }
        };
        const onActionRejected = (reason: string) =>
            dispatch(setToast({ id: `action-rejected-${Date.now()}`, type: 'sad', message: reason, duration: 3000 }));

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.on('action-rejected', onActionRejected);
        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off('action-rejected', onActionRejected);
            socket.close();
        };
    }, [socket, dispatch]);

    const reconnect = useCallback(() => {
        socket.disconnect();
        socket.connect();
    }, [socket]);

    return <SocketContext.Provider value={{ socket, connected, reconnect }}>{children}</SocketContext.Provider>;
}

export function useSocket() {
    const value = useContext(SocketContext);
    if (!value) throw new Error('useSocket must be used inside <SocketProvider>');
    return value;
}

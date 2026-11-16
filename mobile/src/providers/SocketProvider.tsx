import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';

import { API_URL } from '@/lib/config';
import type { AppSocket } from '@/lib/types';

type SocketContextValue = { socket: AppSocket | null; connected: boolean };

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

/**
 * Owns the app's single Socket.io connection.
 * TODO (PLAN.md Step 3/4): pass the auth token in the handshake, and reconnect /
 * re-sync state when the app returns to the foreground (AppState).
 */
export function SocketProvider({ children }: { children: ReactNode }) {
    // Created once; connected/closed by the effect (safe with StrictMode's double effects).
    // Native has no CORS / cookie constraints; plain WebSocket avoids long-polling.
    const [socket] = useState<AppSocket>(() => io(API_URL, { transports: ['websocket'], autoConnect: false }));
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.close();
        };
    }, [socket]);

    return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@dutch-pub/shared';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'sad';

export type TToast = {
    id: string | number;
    type: ToastType;
    message: string;
    duration: number;
    position?: 'top' | 'bottom';
};

export type GeneralState = {
    toast: TToast | null;
};

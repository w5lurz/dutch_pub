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

/** How a game ended: someone won, or the room owner stopped it. */
export type GameEnd = 'won' | 'stopped';

export type GeneralState = {
    toast: TToast | null;
    lastGameEnd: GameEnd | null;
    /** Who won the game that just ended (while the table still shows), else null. */
    winner: string | null;
};

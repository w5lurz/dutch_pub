import { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@dutch-pub/shared';

// Domain types live in the shared package; re-exported so existing imports keep working.
export type {
    User,
    Player,
    TRoom,
    TRooms,
    TCard,
    Cards,
    Opponent,
    Opponents,
    UserCards,
    Game,
    TLeaderBoard,
    ChatMessage,
} from '@dutch-pub/shared';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type TToast = {
    id: string | number;
    type: 'success' | 'info' | 'warning' | 'error' | 'sad';
    message: string;
    duration: number;
    position?: ToastPositionType;
};

export type ToastPositionType = 'topLeft' | 'topCenter' | 'topRight' | 'bottomRight' | 'bottomCenter' | 'bottomLeft';

export type RequiredToastProps = Required<TToast>;

// export type Banner = { type: 'success' | 'info' | 'warning' | 'error'; message: string; duration: number; position: ToastPositionType };

export type GeneralState = {
    toast: TToast | null;
};

export type MessageToastsContextType = {
    add: (toast: Omit<TToast, 'id'>) => void;
    remove: (toastId: number, ref: RefObject<HTMLDivElement>) => void;
    position: ToastPositionType;
};

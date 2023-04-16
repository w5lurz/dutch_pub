import { RefObject } from 'react';

export type User = {
    id: number;
    username: string;
    email?: string;
    inGame?: number;
    isGuest?: boolean;
    socketId?: string;
} | null;

export type Player = { username: string; socketId: string };

export type TRoom = {
    name: string;
    owner: string;
    players: Array<Player>;
    slots: number;
    visibility: string;
    inGame?: boolean;
};

export type TRooms = { [key: number]: TRoom };

export type TCard = {
    name: string;
    value: number;
    color: string; // TODO enum
    isMagicCard?: boolean;
    isTeaseCard?: boolean;
};

export type Cards = Array<TCard>;

export type Opponent = {
    hand: number;
    table: number;
    tableFlipped: Cards;
    active?: boolean;
};

export type Opponents = { [key: string]: Opponent };

export type UserCards = { hand: Cards; table: number; tableFlipped: Cards };

export type Game = {
    userCards: UserCards;
    active?: boolean;
    opponents: Opponents;
    deck: number;
    laidCards: Array<TCard> | null;
    burntCards: Array<TCard> | null;
};

export type TToast = {
    id: string | number; // TODO number not needed
    type: 'success' | 'info' | 'warning' | 'error' | 'sad';
    message: string;
    duration: number;
    position?: ToastPositionType;
    // icon?: ReactNode | boolean;
};

export type ToastPositionType = 'topLeft' | 'topCenter' | 'topRight' | 'bottomRight' | 'bottomCenter' | 'bottomLeft';

export type RequiredToastProps = Required<TToast>;

// export type Banner = { type: 'success' | 'info' | 'warning' | 'error'; message: string; duration: number; position: ToastPositionType };

export type GeneralState = {
    toast: TToast | null;
};

export type TLeaderBoard = Array<{ rank: number; winner: string; wins: number; favouriteFriend: string; latestWin: string }>;

export type MessageToastsContextType = {
    add: (toast: Omit<TToast, 'id'>) => void;
    remove: (toastId: number, ref: RefObject<HTMLDivElement>) => void;
    position: ToastPositionType;
};

export type ChatMessage = {
    id: number;
    senderName: string;
    message: string;
    time: string;
};

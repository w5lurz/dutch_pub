export type User = {
    id: number;
    username: string;
    email: string;
    inGame?: number;
} | null;

export type Player = { username: string; socketId: string };

export type TRoom = {
    name: string;
    owner: string;
    players: Array<Player>;
    slots: number;
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
    // id: number;
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
    duration: number;
    position: ToastPositionType;
    // icon?: ReactNode | boolean;
};

export type ToastPositionType = 'topLeft' | 'topCenter' | 'topRight' | 'bottomRight' | 'bottomCenter' | 'bottomLeft';

export type RequiredToastProps = Required<TToast>;

// export type Banner = { type: 'success' | 'info' | 'warning' | 'error'; message: string; duration: number; position: ToastPositionType };

export type GeneralState = {
    toast: TToast | null;
};

export type User = {
    id: number;
    username: string;
    email: string;
    inGame?: boolean;
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

export type UserCards = { hand: Cards; table: Cards; tableFlipped: Cards };

export type Game = {
    userCards: UserCards;
    opponents: Opponents;
};

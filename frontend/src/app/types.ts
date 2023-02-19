export type User = {
    id: number;
    username: string;
    email: string;
    inGame?: boolean;
} | null;

export type TRoom = {
    name: string;
    owner: string;
    players: Array<string>;
    slots: number;
    inGame?: boolean;
};

export type TRooms = { [key: number]: TRoom };

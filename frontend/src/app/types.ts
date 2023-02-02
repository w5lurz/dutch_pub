export type TRoom = {
    name: string;
    owner: string;
    players: Array<string>;
    slots: number;
};

export type TRooms = { [key: number]: TRoom };

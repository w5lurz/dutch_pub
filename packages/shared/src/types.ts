// Domain types shared by the backend contract and the mobile client.

import type { AvatarId } from './avatars';

export type User = {
    id: number;
    username: string;
    email?: string;
    inGame?: number;
    isGuest?: boolean;
    /** The chosen avatar (registered users only); null / missing = generated from the name. */
    avatar?: AvatarId | null;
} | null;

/**
 * A player in a room. `avatar` is their chosen avatar (null or missing: not chosen, or a
 * guest; show the one generated from the name, see `avatarFor`). Older servers omit it.
 */
export type Player = { username: string; socketId: string; avatar?: AvatarId | null };

/** Colour of the card backs. */
export type CardBackColor = 'red' | 'blue';

/** Options the room owner picks (defaults and validation in roomSettings.ts). */
export type RoomSettings = {
    /** Special cards show what they do on their face (e.g. CLEAR ALL). */
    showCardPowers: boolean;
    /** Colour of the card backs (deck, face-down cards, hands). */
    cardBack: CardBackColor;
};

export type TRoom = {
    name: string;
    owner: string;
    players: Array<Player>;
    slots: number;
    visibility: string;
    inGame?: boolean;
    settings: RoomSettings;
};

export type TRooms = { [key: number]: TRoom };

export type TCard = {
    name: string;
    value: number;
    color: string;
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

/** The current player's own cards. `table` is the number of face-down cards left. */
export type UserCards = { hand: Cards; table: number; tableFlipped: Cards };

/** Per-player view of a game, as sent by the server. */
export type Game = {
    userCards: UserCards;
    active?: boolean;
    opponents: Opponents;
    deck: number;
    laidCards: Array<TCard> | null;
    burntCards: Array<TCard> | null;
};

export type TLeaderBoard = Array<{
    rank: number;
    winner: string;
    wins: number;
    favouriteFriend: string;
    latestWin: string;
    /** Chosen avatars (null / missing: generated from the name). */
    winnerAvatar?: AvatarId | null;
    favouriteFriendAvatar?: AvatarId | null;
}>;

export type ChatMessage = {
    id: number;
    senderName: string;
    message: string;
    time: string;
};

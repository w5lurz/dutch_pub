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
    /** Seconds each player has for a turn before it is skipped; 0 = no timer. */
    turnTimer: TurnTimer;
};

/** The turn timer choices, in seconds (0 = off). */
export type TurnTimer = 0 | 15 | 30 | 60;

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
    /** Swap phase: done swapping. */
    ready?: boolean;
};

export type Opponents = { [key: string]: Opponent };

/** The current player's own cards. `table` is the number of face-down cards left. */
export type UserCards = { hand: Cards; table: number; tableFlipped: Cards };

/**
 * Phase of a game: right after the deal everyone may swap hand cards with their face-up
 * cards ('swap') until all players are ready; then the cards are played ('play').
 */
export type GamePhase = 'swap' | 'play';

/** A face-down card that was played blind and doesn't fit the pile: shown for a moment before its player picks up the pile. */
export type BlindMiss = { username: string; card: TCard };

/** Per-player view of a game, as sent by the server. */
export type Game = {
    userCards: UserCards;
    active?: boolean;
    opponents: Opponents;
    deck: number;
    laidCards: Array<TCard> | null;
    burntCards: Array<TCard> | null;
    /** Missing (older servers): 'play'. */
    phase?: GamePhase;
    /** Swap phase: you are done swapping. */
    ready?: boolean;
    /** Set while a missed blind card lies on top of the pile (no moves meanwhile). */
    blindMiss?: BlindMiss | null;
    /**
     * Turn timer: ms left of the current turn when this view was sent, and the whole turn's
     * length. null / missing: no clock is running (timer off, swap phase, missed blind card).
     */
    turnTimeLeft?: number | null;
    turnTime?: number | null;
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

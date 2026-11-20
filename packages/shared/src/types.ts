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
    /** House rule: a 9 ("You lose") may be laid on a magic card (true: the base game). */
    nineOnMagic: boolean;
    /** House rule: a 6 reverses the turn order. */
    sixReverses: boolean;
    /** Decks in the game: 0 = auto (2 with 4 players, else 1). */
    decks: DeckCount;
};

/** The deck choices: 0 = auto. */
export type DeckCount = 0 | 1 | 2;

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
    /** Their table spots as dealt (missing from older servers: `tableFlipped` / `table` only). */
    spots?: TableSpot[];
};

export type Opponents = { [key: string]: Opponent };

/**
 * One of a player's table spots, as dealt: a face-down card with a face-up card on top. A played
 * card leaves its spot (the others keep theirs).
 */
export type TableSpot = { faceUp: TCard | null; faceDown: boolean };

/**
 * The current player's own cards. `table` is the number of face-down cards left; `spots` where
 * they lie (missing from older servers). A face-down card is played by its place among the
 * face-down cards still there (left to right), not by its spot.
 */
export type UserCards = { hand: Cards; table: number; tableFlipped: Cards; spots?: TableSpot[] };

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
    /** Turn order: 1 = as the seats go (clockwise), -1 = reversed (a 6, with "6 reverses" on). */
    direction?: 1 | -1;
    /** The last Ace's call: `by` laid it, `target` must lay a magic card (cleared by the next move). */
    call?: { by: string; target: string } | null;
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

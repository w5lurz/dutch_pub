// Socket.io event contracts. Use with socket.io-client's typed socket:
//   Socket<ServerToClientEvents, ClientToServerEvents>
// Server handlers live in backend/src/{rooms,game,chat,guests}.js.

import type { ChatMessage, Game, RoomSettings, TCard, TRooms } from './types';

/** Reply to `get-game-state`: everything a client needs to re-sync after a reconnect. */
export type GameState = {
    rooms: TRooms;
    /** The room the user is in, or null. */
    roomId: number | null;
    /** The user's view of their room's game, or null if not started (or not in a room). */
    game: Game | null;
    /** Chat history of the user's room. */
    messages: Array<ChatMessage>;
};

/** Events the server emits to clients. */
export interface ServerToClientEvents {
    /** Also broadcast when a player in a room changes their avatar (`PUT /api/auth/me/avatar`). */
    'rooms-listed': (rooms: TRooms) => void;
    'joined-room': (rooms: TRooms) => void;
    'left-room': (rooms: TRooms) => void;
    'room-deleted': (rooms: TRooms) => void;
    'game-started': (game: Game, rooms: TRooms, roomId: number) => void;
    'card-laid': (game: Game, rooms: TRooms, roomId?: number) => void;
    'cards-drawn': (game: Game, rooms: TRooms, roomId?: number) => void;
    /** Any other change of the game: cards swapped, a player ready, the play phase starting, a missed blind card shown. */
    'game-updated': (game: Game, rooms: TRooms, roomId?: number) => void;
    /** `username` ran out of time: their turn was skipped (the new turn follows in `game-updated`). */
    'turn-timed-out': (username: string) => void;
    'game-won': (winnerUsername: string, rooms: TRooms) => void;
    /** The room owner stopped the game (nobody won); the room is gone from `rooms`. */
    /** `reason` 'owner-left': the owner was disconnected for 2 minutes, so the server stopped it. */
    'game-stopped': (ownerUsername: string, rooms: TRooms, reason?: 'owner-left') => void;
    'message-sent': (messages: Array<ChatMessage>) => void;
    /** Sent only to the player whose `lay-card` was refused by the server (not their turn, invalid card, ...). */
    'lay-card-rejected': (reason: string) => void;
    /** Sent only to the sender when any other action was refused (not logged in, not the owner, ...). */
    'action-rejected': (reason: string) => void;
    'game-state': (state: GameState) => void;
}

/** Events clients emit to the server. */
export interface ClientToServerEvents {
    'list-rooms': () => void;
    /** The app went to the background or came back: while away, "your turn" comes as a push notification. */
    'app-state': (state: 'active' | 'background') => void;
    /** `settings` is optional; missing or invalid values get the defaults (`DEFAULT_ROOM_SETTINGS`). */
    'create-room': (room: { name: string; owner: string; slots: number; visibility: string; settings?: Partial<RoomSettings> }) => void;
    /**
     * Owner only, before the game starts. Keys left out keep their current value. On success
     * the server broadcasts `rooms-listed`; otherwise the sender gets `action-rejected`.
     */
    'update-room-settings': (payload: { roomId: number; settings?: Partial<RoomSettings>; visibility?: 'public' | 'private' }) => void;
    'delete-room': (roomId: number) => void;
    'join-room': (payload: { username: string; roomId: number }) => void;
    'leave-room': (payload: { username: string; roomId: number }) => void;
    'start-game': (roomId: number, socketId?: string) => void;
    /**
     * Owner only, while the game runs: ends it for everyone without a winner (not recorded on
     * the leaderboard) and removes the room. Everyone in it gets `game-stopped`; otherwise the
     * sender gets `action-rejected`.
     */
    'stop-game': (roomId: number) => void;
    /**
     * `card` is a card from hand / face-up table, or the index of a face-down table card.
     * With `cards`: several cards of the same value laid together (`card` is the first of them);
     * the first must fit the pile. Each listed card needs its own copy in the hand / face-up cards.
     */
    /**
     * `call`: with an Ace ("Call Next"), the player who must lay a magic card next (any other
     * player still in the game; missing or invalid: the next player).
     */
    'lay-card': (payload: { card: TCard | number; cards?: TCard[]; cardIndex: number; roomId: number; username?: string; call?: string }) => void;
    'draw-cards': (payload: { roomId: number; username?: string }) => void;
    /** Swap phase, before you are ready: your hand card `hand` and your face-up card `faceUp` trade places. */
    'swap-cards': (payload: { roomId: number; username?: string; hand: TCard; faceUp: TCard }) => void;
    /** Swap phase: you are done swapping. Once everyone is, the play phase starts. */
    'player-ready': (payload: { roomId: number; username?: string }) => void;
    'send-message': (payload: { roomId: number; username?: string; message: string }) => void;
    /** Ask for a `game-state` re-sync (after reconnecting / returning to the foreground). */
    'get-game-state': () => void;
}

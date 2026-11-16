// Socket.io event contracts. Use with socket.io-client's typed socket:
//   Socket<ServerToClientEvents, ClientToServerEvents>
// Server handlers live in backend/src/{rooms,game,chat,guests}.js.

import type { ChatMessage, Game, TCard, TRooms } from './types';

/** Events the server emits to clients. */
export interface ServerToClientEvents {
    'rooms-listed': (rooms: TRooms) => void;
    'joined-room': (rooms: TRooms) => void;
    'left-room': (rooms: TRooms) => void;
    'room-deleted': (rooms: TRooms) => void;
    'game-started': (game: Game, rooms: TRooms, roomId: number) => void;
    'card-laid': (game: Game, rooms: TRooms, roomId?: number) => void;
    'cards-drawn': (game: Game, rooms: TRooms, roomId?: number) => void;
    'game-won': (winnerUsername: string, rooms: TRooms) => void;
    'message-sent': (messages: Array<ChatMessage>) => void;
    'got-socketid': (socketId: string) => void;
    /** Sent only to the player whose `lay-card` was refused by the server (not their turn, invalid card, ...). */
    'lay-card-rejected': (reason: string) => void;
}

/** Events clients emit to the server. */
export interface ClientToServerEvents {
    'list-rooms': () => void;
    'create-room': (room: { name: string; owner: string; slots: number; visibility: string }) => void;
    'delete-room': (roomId: number) => void;
    'join-room': (payload: { username: string; roomId: number }) => void;
    'leave-room': (payload: { username: string; roomId: number }) => void;
    'start-game': (roomId: number, socketId?: string) => void;
    /** `card` is a card from hand / face-up table, or the index of a face-down table card. */
    'lay-card': (payload: { card: TCard | number; cardIndex: number; roomId: number; username?: string }) => void;
    'draw-cards': (payload: { roomId: number; username?: string }) => void;
    'send-message': (payload: { roomId: number; username?: string; message: string }) => void;
    'get-socketid': () => void;
}

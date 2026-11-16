import { useCallback, useMemo } from 'react';
import type { TRoom, TRooms, User } from '@dutch-pub/shared';

import { useSocket } from '@/providers/SocketProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import { setToast } from '@/store/generalSlice';

export type RoomVisibility = 'public' | 'private';

export type NewRoom = { name: string; slots: number; visibility: RoomVisibility };

/** Same rule as the web's `isPrivate` (utils/utilFunctions.ts). */
export const isPrivate = (visibility: string) => visibility === 'private';

export type RoomsDerived = {
    isInAnyRoom: boolean;
    currentRoomId: number | null;
    currentRoom: TRoom | null;
    isAlreadyOwner: boolean;
};

/** Pure derived state, as the web `useRooms` (kept separate so it can be checked without React). */
export function deriveRooms(rooms: TRooms, user: User): RoomsDerived {
    const username = user?.username;
    const entries = Object.entries(rooms) as [string, TRoom][];
    const current = username ? entries.find(([, room]) => room.players.some(player => player.username === username)) : undefined;
    return {
        isInAnyRoom: !!current,
        currentRoomId: current ? Number(current[0]) : null,
        currentRoom: current ? current[1] : null,
        isAlreadyOwner: !!username && entries.some(([, room]) => room.owner === username),
    };
}

export type RoomPermissions = { canJoin: boolean; canLeave: boolean; canDelete: boolean; canStart: boolean };

/** Button rules from the web `Rooms.tsx` (plus: no joining a room whose game already started). */
export function roomPermissions(roomId: number, room: TRoom, user: NonNullable<User>, derived: RoomsDerived): RoomPermissions {
    const { players, slots, owner, inGame = false, visibility = 'private' } = room;
    const isOwner = owner === user.username;
    return {
        canJoin: players.length < slots && !derived.isInAnyRoom && !inGame && (!isPrivate(visibility) || !user.isGuest),
        canLeave: derived.currentRoomId === roomId && !isOwner,
        canDelete: isOwner,
        canStart: isOwner && players.length > 1,
    };
}

/** Whether the "Create room" button shows, as the web `CreateRoomForm` (registered users only). */
export const canCreateRoom = (user: User, derived: RoomsDerived) => !!user?.email && !derived.isAlreadyOwner && !derived.isInAnyRoom;

/**
 * Rooms lobby: derived state from the store (kept in sync by GameSync) plus actions that
 * only emit socket events. Toasts match the web app.
 */
export function useRooms() {
    const { socket, connected } = useSocket();
    const dispatch = useAppDispatch();
    const rooms = useAppSelector(state => state.rooms);
    const user = useAppSelector(state => state.user);

    const derived = useMemo(() => deriveRooms(rooms, user), [rooms, user]);

    const toast = useCallback(
        (id: string, message: string) => dispatch(setToast({ id, type: 'success', message, duration: 3000 })),
        [dispatch],
    );

    const createRoom = useCallback(
        ({ name, slots, visibility }: NewRoom) => {
            if (!user) return;
            socket.emit('create-room', { name, owner: user.username, slots, visibility });
            toast(`create-room-${name}-success`, `You successfully created Room ${name}!`);
        },
        [socket, user, toast],
    );

    const joinRoom = useCallback(
        (roomId: number, name: string) => {
            if (!user) return;
            socket.emit('join-room', { username: user.username, roomId });
            toast(`join-room-${roomId}-success`, `You successfully joined Room ${name}!`);
        },
        [socket, user, toast],
    );

    const leaveRoom = useCallback(
        (roomId: number, name: string) => {
            if (!user) return;
            socket.emit('leave-room', { username: user.username, roomId });
            toast(`leave-room-${roomId}-success`, `You successfully left Room ${name}!`);
        },
        [socket, user, toast],
    );

    const deleteRoom = useCallback(
        (roomId: number, name: string) => {
            socket.emit('delete-room', roomId);
            toast(`delete-room-${roomId}-success`, `You successfully deleted Room ${name}!`);
        },
        [socket, toast],
    );

    const startGame = useCallback(
        (roomId: number, name: string) => {
            socket.emit('start-game', roomId, socket.id);
            toast(`start-room-${roomId}-success`, `You started game from Room ${name}!`);
        },
        [socket, toast],
    );

    const refresh = useCallback(() => {
        socket.emit('list-rooms');
    }, [socket]);

    /** Which actions the signed-in user has on a room (all false when signed out). */
    const permissionsFor = useCallback(
        (roomId: number, room: TRoom): RoomPermissions =>
            user ? roomPermissions(roomId, room, user, derived) : { canJoin: false, canLeave: false, canDelete: false, canStart: false },
        [user, derived],
    );

    return {
        rooms,
        user,
        connected,
        ...derived,
        canCreateRoom: canCreateRoom(user, derived),
        permissionsFor,
        createRoom,
        joinRoom,
        leaveRoom,
        deleteRoom,
        startGame,
        refresh,
    };
}

export default useRooms;

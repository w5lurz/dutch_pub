import { useMemo } from 'react';
import { normalizeRoomSettings, type RoomSettings } from '@dutch-pub/shared';

import { useAppSelector } from '@/store';
import { deriveRooms } from './useRooms';

/**
 * The settings of room `roomId`, or of the user's current room when `roomId` is left out.
 * Returns `DEFAULT_ROOM_SETTINGS` while the room is unknown (or from a server without
 * settings), so callers never have to check.
 */
export function useRoomSettings(roomId?: number | null): RoomSettings {
    const room = useAppSelector(state => {
        if (roomId != null) return state.rooms[roomId];
        const { currentRoom } = deriveRooms(state.rooms, state.user);
        return currentRoom ?? undefined;
    });
    const settings = room?.settings;
    return useMemo(() => normalizeRoomSettings(settings), [settings]);
}

export default useRoomSettings;

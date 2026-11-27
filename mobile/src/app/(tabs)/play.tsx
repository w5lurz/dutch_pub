import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { normalizeRoomSettings, type TRoom, type TRooms } from '@dutch-pub/shared';

import { CreateRoomModal } from '@/components/rooms/CreateRoomModal';
import { GuestJoinForm } from '@/components/rooms/GuestJoinForm';
import { RoomCard } from '@/components/rooms/RoomCard';
import { RoomSettingsSheet } from '@/components/rooms/RoomSettingsSheet';
import { Button, Screen } from '@/components/ui';
import { useRooms, type NewRoom } from '@/hooks/useRooms';

type RoomItem = { id: number; room: TRoom };

/** Give up on the refresh spinner if no `rooms-listed` arrives (e.g. a lost reply). */
const REFRESH_TIMEOUT_MS = 2000;

function NotConnectedHint() {
    const { t } = useTranslation();
    return (
        <View accessibilityLiveRegion="polite" className="rounded-md bg-yellow-100 px-3 py-2">
            <Text className="text-sm font-medium text-yellow-800">{t('play.notConnected')}</Text>
        </View>
    );
}

function EmptyRooms() {
    const { t } = useTranslation();
    return (
        <View className="items-center gap-2 py-8">
            <Text className="text-lg text-gray-900">{t('play.emptyTitle')}</Text>
            <Text className="text-center text-base text-gray-700">{t('play.emptyText')}</Text>
        </View>
    );
}

export default function PlayScreen() {
    const { t } = useTranslation();
    const {
        rooms,
        user,
        connected,
        currentRoomId,
        canCreateRoom,
        permissionsFor,
        createRoom,
        joinRoom,
        leaveRoom,
        addBot,
        removeBot,
        deleteRoom,
        startGame,
        updateRoomSettings,
        updateRoomVisibility,
        refresh,
    } = useRooms();
    const [createVisible, setCreateVisible] = useState(false);
    // The room whose settings sheet is open.
    const [settingsRoomId, setSettingsRoomId] = useState<number | null>(null);
    const settingsRoom = settingsRoomId !== null ? rooms[settingsRoomId] : undefined;
    // The rooms list a refresh started from: the spinner stops as soon as a new list arrives.
    const [refreshedFrom, setRefreshedFrom] = useState<TRooms | null>(null);
    const refreshing = refreshedFrom !== null && refreshedFrom === rooms;

    // Your room first, then the ones you can join, then the rest; running games last.
    const items = useMemo<RoomItem[]>(() => {
        const rank = ({ id, room }: RoomItem) => (id === currentRoomId ? 0 : room.inGame ? 3 : permissionsFor(id, room).canJoin ? 1 : 2);
        return Object.entries(rooms)
            .map(([id, room]) => ({ id: Number(id), room }))
            .sort((a, b) => rank(a) - rank(b) || a.id - b.id);
    }, [rooms, currentRoomId, permissionsFor]);

    useEffect(() => {
        if (!refreshing) return;
        const timer = setTimeout(() => setRefreshedFrom(null), REFRESH_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [refreshing]);

    const onRefresh = () => {
        if (!connected) return;
        setRefreshedFrom(rooms);
        refresh();
    };

    const onCreate = (room: NewRoom) => {
        createRoom(room);
        setCreateVisible(false);
    };

    return (
        <Screen padded={false} background="gray">
            <FlatList
                data={items}
                keyExtractor={item => String(item.id)}
                contentContainerClassName="grow gap-3 p-4"
                keyboardShouldPersistTaps="handled"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={
                    <View className="gap-3">
                        {connected ? null : <NotConnectedHint />}
                        {/* Signed out: play as a guest on top, the rooms (read-only) below. */}
                        {user ? null : <GuestJoinForm disabled={!connected} />}
                        {items.length > 0 ? (
                            <Text accessibilityRole="header" className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                                {t('play.roomCount', { count: items.length })}
                            </Text>
                        ) : null}
                    </View>
                }
                renderItem={({ item: { id, room } }) => (
                    <RoomCard
                        room={room}
                        isCurrent={currentRoomId === id}
                        permissions={permissionsFor(id, room)}
                        disabled={!connected}
                        onJoin={() => joinRoom(id, room.name)}
                        onLeave={() => leaveRoom(id, room.name)}
                        onDelete={() => deleteRoom(id, room.name)}
                        onStart={() => startGame(id, room.name)}
                        onSettings={() => setSettingsRoomId(id)}
                        onAddBot={() => addBot(id)}
                        onRemoveBot={username => removeBot(id, username)}
                    />
                )}
                ListEmptyComponent={EmptyRooms}
            />
            {/* Below the list, not in it: always in reach, however many rooms there are. */}
            {canCreateRoom ? (
                <View className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                    <Button label={t('play.createRoom')} variant="green" disabled={!connected} onPress={() => setCreateVisible(true)} className="w-full" />
                </View>
            ) : null}
            {/* Hidden as soon as the user can no longer create a room (e.g. joined one meanwhile). */}
            <CreateRoomModal
                visible={createVisible && canCreateRoom}
                onClose={() => setCreateVisible(false)}
                onCreate={onCreate}
                disabled={!connected}
                ownerName={user?.username}
            />
            {/* Unmounts when the room goes away (deleted, game won). */}
            {settingsRoom && settingsRoomId !== null ? (
                <RoomSettingsSheet
                    visible
                    roomName={settingsRoom.name}
                    settings={normalizeRoomSettings(settingsRoom.settings)}
                    canEdit={permissionsFor(settingsRoomId, settingsRoom).canEditSettings}
                    disabled={!connected}
                    onChange={change => updateRoomSettings(settingsRoomId, change)}
                    visibility={settingsRoom.visibility === 'public' ? 'public' : 'private'}
                    onVisibilityChange={visibility => updateRoomVisibility(settingsRoomId, visibility)}
                    onClose={() => setSettingsRoomId(null)}
                />
            ) : null}
        </Screen>
    );
}

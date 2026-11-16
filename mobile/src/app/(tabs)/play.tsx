import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import type { TRoom, TRooms } from '@dutch-pub/shared';

import { CreateRoomModal } from '@/components/rooms/CreateRoomModal';
import { GuestJoinForm } from '@/components/rooms/GuestJoinForm';
import { RoomCard } from '@/components/rooms/RoomCard';
import { Button, Screen } from '@/components/ui';
import { useRooms, type NewRoom } from '@/hooks/useRooms';

type RoomItem = { id: number; room: TRoom };

/** Give up on the refresh spinner if no `rooms-listed` arrives (e.g. a lost reply). */
const REFRESH_TIMEOUT_MS = 2000;

function NotConnectedHint() {
    return (
        <View accessibilityLiveRegion="polite" className="mb-3 rounded-md bg-yellow-100 px-3 py-2">
            <Text className="text-sm font-medium text-yellow-800">Not connected – actions are disabled until the connection is back.</Text>
        </View>
    );
}

function EmptyRooms() {
    return (
        <View className="items-center gap-2 py-8">
            <Text className="text-lg text-gray-900">No Room created yet!</Text>
            <Text className="text-center text-base text-gray-700">
                You can create a new room by clicking on the Create room button - however if you cannot see it you may had not logged in
                yet.
            </Text>
        </View>
    );
}

export default function PlayScreen() {
    const { rooms, user, connected, currentRoomId, canCreateRoom, permissionsFor, createRoom, joinRoom, leaveRoom, deleteRoom, startGame, refresh } =
        useRooms();
    const [createVisible, setCreateVisible] = useState(false);
    // The rooms list a refresh started from: the spinner stops as soon as a new list arrives.
    const [refreshedFrom, setRefreshedFrom] = useState<TRooms | null>(null);
    const refreshing = refreshedFrom !== null && refreshedFrom === rooms;

    const items = useMemo<RoomItem[]>(() => Object.entries(rooms).map(([id, room]) => ({ id: Number(id), room })), [rooms]);

    useEffect(() => {
        if (!refreshing) return;
        const timer = setTimeout(() => setRefreshedFrom(null), REFRESH_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [refreshing]);

    if (!user) {
        return (
            <Screen padded={false} background="gray">
                {!connected ? (
                    <View className="px-4 pt-4">
                        <NotConnectedHint />
                    </View>
                ) : null}
                <GuestJoinForm disabled={!connected} />
            </Screen>
        );
    }

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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={connected ? undefined : <NotConnectedHint />}
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
                    />
                )}
                ListEmptyComponent={EmptyRooms}
                ListFooterComponent={
                    canCreateRoom ? (
                        <Button
                            label="Create room"
                            variant="green"
                            disabled={!connected}
                            onPress={() => setCreateVisible(true)}
                            className="mt-1 self-center"
                        />
                    ) : undefined
                }
            />
            {/* Hidden as soon as the user can no longer create a room (e.g. joined one meanwhile). */}
            <CreateRoomModal
                visible={createVisible && canCreateRoom}
                onClose={() => setCreateVisible(false)}
                onCreate={onCreate}
                disabled={!connected}
            />
        </Screen>
    );
}

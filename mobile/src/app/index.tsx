import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { TRooms } from '@dutch-pub/shared';

import { api } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { useSocket } from '@/providers/SocketProvider';
import { setToast } from '@/store/generalSlice';
import { useAppDispatch } from '@/store';

/**
 * Placeholder home screen (PLAN.md Step 2): proves the wiring of NativeWind, Redux,
 * the toast host, the shared package and the socket connection. Replaced by the
 * real Welcome screen in Step 5.
 */
export default function Index() {
    const { socket, connected } = useSocket();
    const dispatch = useAppDispatch();
    const [roomCount, setRoomCount] = useState<number | null>(null);
    const [apiStatus, setApiStatus] = useState<string>('checking…');

    useEffect(() => {
        api.getLeaderBoard()
            .then(res => setApiStatus(res.ok || res.status === 404 ? 'reachable' : `HTTP ${res.status}`))
            .catch(() => setApiStatus('unreachable'));
    }, []);

    useEffect(() => {
        if (!socket || !connected) return;
        const onRoomsListed = (rooms: TRooms) => setRoomCount(Object.keys(rooms).length);
        socket.on('rooms-listed', onRoomsListed);
        socket.emit('list-rooms');
        return () => {
            socket.off('rooms-listed', onRoomsListed);
        };
    }, [socket, connected]);

    return (
        <View className="flex-1 items-center justify-center gap-4 bg-white p-6">
            <Text className="text-3xl font-bold text-gray-800">Dutch Pub</Text>
            <View className="items-center gap-1">
                <Text className="text-sm text-gray-500">{API_URL}</Text>
                <View className="flex-row items-center gap-2">
                    <View className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <Text className="text-base text-gray-700">{connected ? 'Connected' : 'Not connected'}</Text>
                </View>
                <Text className="text-base text-gray-700">REST API: {apiStatus}</Text>
                {roomCount !== null && <Text className="text-base text-gray-700">Open rooms: {roomCount}</Text>}
            </View>
            <Pressable
                className="rounded-md bg-blue-500 px-4 py-2 active:bg-blue-700"
                onPress={() =>
                    dispatch(setToast({ id: Date.now(), type: 'success', message: 'Toasts work!', duration: 3000 }))
                }
            >
                <Text className="font-medium text-white">Show toast</Text>
            </Pressable>
        </View>
    );
}

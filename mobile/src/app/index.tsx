import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { TRooms } from '@dutch-pub/shared';

import { useSession } from '@/hooks/useSession';
import { api } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { useSocket } from '@/providers/SocketProvider';
import { setToast } from '@/store/generalSlice';
import { useAppDispatch, useAppSelector } from '@/store';

/**
 * Placeholder home screen: shows the wiring of NativeWind, Redux, the toast host, the
 * shared package, the socket connection (Step 2) and the token session (Step 3).
 * Replaced by the real Welcome / Login screens in Step 5.
 */
export default function Index() {
    const { socket, connected } = useSocket();
    const { joinAsGuest, logOut } = useSession();
    const user = useAppSelector(state => state.user);
    const dispatch = useAppDispatch();
    const [roomCount, setRoomCount] = useState<number | null>(null);
    const [apiStatus, setApiStatus] = useState<string>('checking…');
    const [guestName, setGuestName] = useState('');

    useEffect(() => {
        api.getLeaderBoard()
            .then(res => setApiStatus(res.ok || res.status === 404 ? 'reachable' : `HTTP ${res.status}`))
            .catch(() => setApiStatus('unreachable'));
    }, []);

    useEffect(() => {
        if (!connected) return;
        const onRoomsListed = (rooms: TRooms) => setRoomCount(Object.keys(rooms).length);
        socket.on('rooms-listed', onRoomsListed);
        socket.emit('list-rooms');
        return () => {
            socket.off('rooms-listed', onRoomsListed);
        };
    }, [socket, connected]);

    const toast = (type: 'success' | 'error', message: string) =>
        dispatch(setToast({ id: Date.now(), type, message, duration: 3000 }));

    const handleJoinAsGuest = async () => {
        const result = await joinAsGuest(guestName.trim());
        if (result.ok) toast('success', 'Your Guest account added!');
        else toast('error', result.message);
    };

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

            {user ? (
                <View className="items-center gap-2">
                    <Text className="text-base text-gray-700">
                        Signed in as <Text className="font-semibold">{user.username}</Text>
                        {user.isGuest ? ' (guest)' : ''}
                    </Text>
                    <Pressable className="rounded-md bg-gray-600 px-4 py-2 active:bg-gray-800" onPress={logOut}>
                        <Text className="font-medium text-white">Log out</Text>
                    </Pressable>
                </View>
            ) : (
                <View className="w-full max-w-xs gap-2">
                    <TextInput
                        className="rounded-md border border-gray-300 bg-gray-50 p-2.5 text-gray-900"
                        placeholder="Guest username"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={guestName}
                        onChangeText={setGuestName}
                    />
                    <Pressable
                        className="items-center rounded-md bg-green-600 px-4 py-2 active:bg-green-800 disabled:opacity-50"
                        disabled={!guestName.trim()}
                        onPress={handleJoinAsGuest}
                    >
                        <Text className="font-medium text-white">Join as guest</Text>
                    </Pressable>
                </View>
            )}

            <Pressable className="rounded-md bg-blue-500 px-4 py-2 active:bg-blue-700" onPress={() => toast('success', 'Toasts work!')}>
                <Text className="font-medium text-white">Show toast</Text>
            </Pressable>
        </View>
    );
}

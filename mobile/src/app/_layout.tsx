import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import ConnectionBanner from '@/components/ConnectionBanner';
import Toast from '@/components/Toast';
import { useSession } from '@/hooks/useSession';
import { GameSync } from '@/providers/GameSync';
import { SocketProvider } from '@/providers/SocketProvider';
import { store } from '@/store';

/** Loads the logged-in user from the stored token once, on app start. */
function RestoreSession() {
    const { restoreSession } = useSession();
    useEffect(() => {
        restoreSession();
    }, [restoreSession]);
    return null;
}

export default function RootLayout() {
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <SocketProvider>
                    <RestoreSession />
                    <GameSync />
                    <StatusBar style="light" />
                    <Stack
                        screenOptions={{
                            headerStyle: { backgroundColor: '#374151' }, // gray-700, as the web navbar
                            headerTintColor: '#ffffff',
                            contentStyle: { backgroundColor: '#ffffff' },
                        }}
                    >
                        <Stack.Screen name="index" options={{ title: 'Dutch Pub' }} />
                    </Stack>
                    <ConnectionBanner />
                    <Toast />
                </SocketProvider>
            </SafeAreaProvider>
        </Provider>
    );
}

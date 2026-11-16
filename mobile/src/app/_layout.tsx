import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import Toast from '@/components/Toast';
import { SocketProvider } from '@/providers/SocketProvider';
import { store } from '@/store';

export default function RootLayout() {
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <SocketProvider>
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
                    <Toast />
                </SocketProvider>
            </SafeAreaProvider>
        </Provider>
    );
}

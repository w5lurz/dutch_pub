import '../global.css';

import { useEffect } from 'react';
import { Stack, ThemeProvider, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import ConnectionBanner from '@/components/ConnectionBanner';
import { lockPortrait } from '@/components/game/orientation';
import Toast from '@/components/Toast';
import { useSession } from '@/hooks/useSession';
import { GameSync } from '@/providers/GameSync';
import { navigationTheme, useTheme } from '@/lib/theme';
import { SocketProvider } from '@/providers/SocketProvider';
import { store, useAppSelector } from '@/store';

// The app is portrait; only the game screen switches to landscape while focused
// (`useLandscapeWhileFocused`). app.json allows both (`"orientation": "default"`), so this
// lock is what keeps the other screens upright. Done at module load, before any screen's
// effects run, so it can never override the game screen's landscape lock on a cold start
// straight into a running game.
lockPortrait();

/** Loads the logged-in user from the stored token once, on app start. */
function RestoreSession() {
    const { restoreSession } = useSession();
    useEffect(() => {
        restoreSession();
    }, [restoreSession]);
    return null;
}

/**
 * Sends the user to /game whenever they are in a running game (`user.inGame` set by
 * `game-started` or a `game-state` re-sync) and not already there. Leaving /game when
 * `inGame` clears is the game screen's job.
 */
function InGameRedirect() {
    const inGame = useAppSelector(state => state.user?.inGame);
    const pathname = usePathname();
    const router = useRouter();
    const navigationReady = !!useRootNavigationState()?.key;

    useEffect(() => {
        if (navigationReady && inGame !== undefined && pathname !== '/game') {
            router.replace('/game');
        }
    }, [navigationReady, inGame, pathname, router]);

    return null;
}

export default function RootLayout() {
    const colors = useTheme();
    return (
        // Gesture Handler (card drag & drop in the game) needs its root view at the top.
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Provider store={store}>
                <SafeAreaProvider>
                    <SocketProvider>
                        <RestoreSession />
                        <GameSync />
                        <InGameRedirect />
                        <StatusBar style="light" />
                        <ThemeProvider value={navigationTheme(colors)}>
                            <Stack
                                screenOptions={{
                                    headerStyle: { backgroundColor: '#374151' }, // gray-700, as the web navbar
                                    headerTintColor: '#ffffff',
                                    contentStyle: { backgroundColor: colors.surface },
                                }}
                            >
                                <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Dutch Pub' }} />
                                <Stack.Screen name="login" options={{ title: 'Log in' }} />
                                <Stack.Screen name="registration" options={{ title: 'Registration' }} />
                                {/* No way back out of a running game: no header (so no back button), no swipe-back. */}
                                <Stack.Screen
                                    name="game"
                                    options={{ title: 'Game', headerShown: false, headerBackVisible: false, gestureEnabled: false }}
                                />
                            </Stack>
                        </ThemeProvider>
                        <ConnectionBanner />
                        <Toast />
                    </SocketProvider>
                </SafeAreaProvider>
            </Provider>
        </GestureHandlerRootView>
    );
}

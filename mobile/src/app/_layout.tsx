import '../global.css';

import { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack, ThemeProvider, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';

import ConnectionBanner from '@/components/ConnectionBanner';
import { lockPortrait } from '@/components/game/orientation';
import Toast from '@/components/Toast';
import UpdateRequired from '@/components/UpdateRequired';
import { useSession } from '@/hooks/useSession';
import { initLanguage } from '@/i18n';
import { GameSync } from '@/providers/GameSync';
import { navigationTheme, useTheme } from '@/lib/theme';
import { initCrashReporting } from '@/lib/crashReporting';
import { initNotifications } from '@/lib/notifications';
import { initSounds } from '@/lib/sounds';
import { SocketProvider } from '@/providers/SocketProvider';
import { store, useAppSelector } from '@/store';

// The app is portrait; only the game screen unlocks the orientation while focused
// (`useAnyOrientationWhileFocused`). app.json allows both (`"orientation": "default"`), so this
// lock is what keeps the other screens upright. Done at module load, before any screen's
// effects run, so it can never override the game screen's unlock on a cold start
// straight into a running game.
lockPortrait();

// Crash and error reports (Sentry), in release builds with a DSN only.
initCrashReporting();
initLanguage();
initSounds();
initNotifications();

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
        // Dev builds may open the preview screens (/dev/...) during a game; back returns to it.
        const devPreview = __DEV__ && pathname.startsWith('/dev/');
        if (navigationReady && inGame !== undefined && pathname !== '/game' && !devPreview) {
            router.replace('/game');
        }
    }, [navigationReady, inGame, pathname, router]);

    return null;
}

function RootLayout() {
    const colors = useTheme();
    const { t } = useTranslation();
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
                        {/* Android: hide the system navigation bar (back / home / apps); a swipe
                            up from the bottom edge shows it for a moment. */}
                        <NavigationBar hidden />
                        <ThemeProvider value={navigationTheme(colors)}>
                            <Stack
                                screenOptions={{
                                    headerStyle: { backgroundColor: '#374151' }, // gray-700, as the web navbar
                                    headerTintColor: '#ffffff',
                                    contentStyle: { backgroundColor: colors.surface },
                                }}
                            >
                                <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Dutch Pub' }} />
                                <Stack.Screen name="login" options={{ title: t('screens.login') }} />
                                <Stack.Screen name="registration" options={{ title: t('screens.registration') }} />
                                <Stack.Screen name="forgot-password" options={{ title: t('screens.forgotPassword') }} />
                                {/* Dev-only mock game table (UI work), see src/app/dev/table.tsx. */}
                                <Stack.Screen name="dev/table" options={{ headerShown: false }} />
                                <Stack.Screen name="dev/cards" options={{ title: 'Card preview' }} />
                                <Stack.Screen name="dev/avatars" options={{ title: 'Avatar preview' }} />
                                {/* No way back out of a running game: no header (so no back button), no swipe-back. */}
                                <Stack.Screen
                                    name="game"
                                    options={{ title: t('screens.game'), headerShown: false, headerBackVisible: false, gestureEnabled: false }}
                                />
                            </Stack>
                        </ThemeProvider>
                        <ConnectionBanner />
                        <Toast />
                        {/* Last: covers everything once the server refuses this app version. */}
                        <UpdateRequired />
                    </SocketProvider>
                </SafeAreaProvider>
            </Provider>
        </GestureHandlerRootView>
    );
}

// Wrapped so crashes during rendering are reported too (a no-op while reporting is off).
export default Sentry.wrap(RootLayout);

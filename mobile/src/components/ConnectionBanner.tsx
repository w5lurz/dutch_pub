import { Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSocket } from '@/providers/SocketProvider';

/** Shows "Reconnecting…" while a previously working connection is down. Mount once. */
export default function ConnectionBanner() {
    const { connected, everConnected } = useSocket();
    const insets = useSafeAreaInsets();

    if (connected || !everConnected) return null;

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            pointerEvents="none"
            className="absolute left-0 right-0 z-40 items-center bg-yellow-400 py-1"
            style={{ bottom: 0, paddingBottom: insets.bottom + 4 }}
        >
            <Text className="text-sm font-medium text-gray-900">Connection lost – reconnecting…</Text>
        </Animated.View>
    );
}

import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ToastType } from '@/lib/types';
import { setToast } from '@/store/generalSlice';
import { useAppDispatch, useAppSelector } from '@/store';

const icons: Record<ToastType, string> = { success: '🎉', info: 'ℹ️', warning: '⚠️', error: '❌', sad: '😔' };

const colors: Record<ToastType, string> = {
    success: 'bg-green-100 border-green-400',
    info: 'bg-blue-100 border-blue-400',
    warning: 'bg-yellow-100 border-yellow-400',
    error: 'bg-red-100 border-red-400',
    sad: 'bg-gray-100 border-gray-400',
};

/** Global toast host, driven by `general.toast` in the store. Mount once in the root layout. */
export default function Toast() {
    const toast = useAppSelector(state => state.general.toast);
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!toast) return;
        const timeout = setTimeout(() => dispatch(setToast(null)), toast.duration);
        return () => clearTimeout(timeout);
    }, [toast, dispatch]);

    if (!toast) return null;

    const atBottom = toast.position === 'bottom';
    return (
        <Animated.View
            key={toast.id}
            entering={FadeInUp}
            exiting={FadeOutUp}
            pointerEvents="box-none"
            className="absolute left-4 right-4 z-50 items-center"
            style={atBottom ? { bottom: insets.bottom + 16 } : { top: insets.top + 8 }}
        >
            <Pressable
                accessibilityRole="alert"
                onPress={() => dispatch(setToast(null))}
                className={`w-full max-w-sm rounded-md border p-4 shadow-lg ${colors[toast.type]}`}
            >
                <Text className="text-base text-gray-900">
                    {`${icons[toast.type]}  ${toast.message}`}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

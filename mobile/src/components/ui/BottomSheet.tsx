import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons';
import { useTheme } from '@/lib/theme';

export type BottomSheetProps = {
    visible: boolean;
    title: string;
    onClose: () => void;
    /** Accessibility label of the close (X) button. Default "Close". */
    closeLabel?: string;
    children: ReactNode;
};

/** A modal sheet sliding up from the bottom, with a title, a close button and a dimmed backdrop that closes it. */
export function BottomSheet({ visible, title, onClose, closeLabel = 'Close', children }: BottomSheetProps) {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
                <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} className="absolute inset-0 bg-black/40" />
                <View className="max-h-[90%] gap-4 rounded-t-2xl bg-white p-5" style={{ paddingBottom: insets.bottom + 20 }}>
                    <View className="flex-row items-center justify-between">
                        <Text accessibilityRole="header" className="text-xl font-bold text-gray-900">
                            {title}
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={closeLabel}
                            hitSlop={12}
                            onPress={onClose}
                            className="rounded p-1 active:bg-gray-100"
                        >
                            <CloseIcon size={24} color={colors.textMuted} />
                        </Pressable>
                    </View>
                    {children}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export default BottomSheet;

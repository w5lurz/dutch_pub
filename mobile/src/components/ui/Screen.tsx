import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

export type ScreenProps = {
    children: ReactNode;
    /** Wrap the content in a ScrollView. Default false. */
    scroll?: boolean;
    /**
     * Safe-area edges to pad. Default `['left', 'right']`, which suits screens under a
     * navigator header and above the tab bar (they already cover top / bottom). Pass
     * e.g. `['top', 'left', 'right', 'bottom']` for a headerless screen.
     */
    edges?: readonly Edge[];
    /** Adds `p-4` around the content. Default true. */
    padded?: boolean;
    background?: 'white' | 'gray';
    /** Classes for the outer container. */
    className?: string;
    /** Classes for the content (the ScrollView content container, or the inner View). */
    contentClassName?: string;
};

export function Screen({
    children,
    scroll = false,
    edges = ['left', 'right'],
    padded = true,
    background = 'white',
    className = '',
    contentClassName = '',
}: ScreenProps) {
    const insets = useSafeAreaInsets();
    const safeArea = {
        paddingTop: edges.includes('top') ? insets.top : 0,
        paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
        paddingLeft: edges.includes('left') ? insets.left : 0,
        paddingRight: edges.includes('right') ? insets.right : 0,
    };
    const bg = background === 'white' ? 'bg-white' : 'bg-gray-50';
    const padding = padded ? 'p-4' : '';

    return (
        <View className={`flex-1 ${bg} ${className}`} style={safeArea}>
            {scroll ? (
                <ScrollView
                    className="flex-1"
                    contentContainerClassName={`grow ${padding} ${contentClassName}`}
                    keyboardShouldPersistTaps="handled"
                >
                    {children}
                </ScrollView>
            ) : (
                <View className={`flex-1 ${padding} ${contentClassName}`}>{children}</View>
            )}
        </View>
    );
}

export default Screen;

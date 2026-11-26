import type { ReactNode } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Trans } from 'react-i18next';

type TableBannerProps = {
    /** The big line (may hold a highlighted name). */
    title: ReactNode;
    /** The smaller line under it. */
    subtitle?: string;
    /** What screen readers announce. */
    label: string;
    /** How far down the window it sits (0 = top, 1 = bottom). */
    at?: number;
};

/**
 * A big message over the table for everyone (who picked up the pile, who won): fades in and
 * out, no touches.
 */
export function TableBanner({ title, subtitle, label, at = 0.2 }: TableBannerProps) {
    const window = useWindowDimensions();
    return (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: window.height * at, alignItems: 'center' }}>
            <Animated.View
                entering={FadeIn.duration(250)}
                exiting={FadeOut.duration(250)}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                accessibilityLabel={label}
                style={{
                    alignItems: 'center',
                    borderRadius: 16,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    borderWidth: 2,
                    borderColor: '#fbbf24',
                    maxWidth: window.width * 0.9,
                    shadowColor: '#000',
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 12,
                }}
            >
                <Text numberOfLines={2} style={{ color: '#ffffff', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
                    {title}
                </Text>
                {subtitle ? <Text style={{ color: '#d1d5db', fontSize: 15, fontWeight: '600', marginTop: 2 }}>{subtitle}</Text> : null}
            </Animated.View>
        </View>
    );
}

/** A translated line with the player's name highlighted (`<n>` in the text). */
export function NameLine({ i18nKey, name }: { i18nKey: 'game.pickUp.title' | 'game.win.title'; name: string }) {
    return <Trans i18nKey={i18nKey} values={{ name }} components={{ n: <Text style={{ color: '#fde68a' }} /> }} />;
}

export default TableBanner;

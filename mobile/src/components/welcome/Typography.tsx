import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type TextProps = { children: ReactNode; className?: string };

/** Page title (web `h1`). */
export function Title({ children, className = '' }: TextProps) {
    return (
        <Text accessibilityRole="header" className={`text-center text-2xl font-semibold text-gray-800 ${className}`}>
            {children}
        </Text>
    );
}

/** Section heading (web `h5`). */
export function SectionHeading({ children, className = '' }: TextProps) {
    return (
        <Text accessibilityRole="header" className={`mt-6 text-xl font-semibold text-gray-800 ${className}`}>
            {children}
        </Text>
    );
}

/** Sub-section heading (web `h6`). */
export function SubHeading({ children, className = '' }: TextProps) {
    return (
        <Text accessibilityRole="header" className={`mt-4 text-base font-semibold text-gray-800 ${className}`}>
            {children}
        </Text>
    );
}

export function Paragraph({ children, className = '' }: TextProps) {
    return <Text className={`my-2 text-base leading-6 text-gray-800 ${className}`}>{children}</Text>;
}

/** Inline bold text; must be nested inside a `Paragraph` or `Bullet`. */
export function Strong({ children }: { children: ReactNode }) {
    return <Text className="font-semibold">{children}</Text>;
}

/** A `<ul>` replacement: wraps `Bullet`s. */
export function BulletList({ children, className = '' }: TextProps) {
    return (
        <View accessibilityRole="list" className={`my-3 gap-2 ${className}`}>
            {children}
        </View>
    );
}

/** A `<li>` replacement with a disc marker; long text wraps under itself, not under the marker. */
export function Bullet({ children }: { children: ReactNode }) {
    return (
        <View className="flex-row pl-2">
            <Text className="w-5 text-base leading-6 text-gray-800" importantForAccessibility="no" accessibilityElementsHidden>
                {'•'}
            </Text>
            <Text className="flex-1 text-base leading-6 text-gray-800">{children}</Text>
        </View>
    );
}

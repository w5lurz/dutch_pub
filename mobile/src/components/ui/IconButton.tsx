import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { useTheme } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type IconButtonProps = Omit<PressableProps, 'children'> & {
    /** An Ionicons name, e.g. 'eye-outline'. */
    icon: IconName;
    /** Required: the button has no text, so this is what screen readers say. */
    accessibilityLabel: string;
    /** Icon size in dp (the touch target is at least 44dp). Default 22. */
    size?: number;
    /** Icon colour; default the theme's muted text colour. */
    color?: string;
    className?: string;
};

/** A borderless button showing only an icon (e.g. show / hide a password). */
export function IconButton({ icon, accessibilityLabel, size = 22, color, className = '', disabled, ...pressableProps }: IconButtonProps) {
    const colors = useTheme();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled: !!disabled }}
            disabled={disabled}
            hitSlop={8}
            className={`h-11 w-11 items-center justify-center rounded-full active:bg-gray-200 ${disabled ? 'opacity-50' : ''} ${className}`}
            {...pressableProps}
        >
            <Ionicons name={icon} size={size} color={color ?? colors.textMuted} />
        </Pressable>
    );
}

export default IconButton;

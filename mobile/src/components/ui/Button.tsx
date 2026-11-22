import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useTheme } from '@/lib/theme';

export type ButtonVariant = 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'outline';
export type ButtonSize = 'sm' | 'md';

export type ButtonProps = {
    label: string;
    onPress: () => void;
    /** Color scheme, as the web's `calculateColorClasses`. Default 'green'. */
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    /** Shows a spinner instead of the label and blocks presses. */
    loading?: boolean;
    /** Extra classes for the outer Pressable (e.g. `w-full`, margins). */
    className?: string;
    accessibilityLabel?: string;
    testID?: string;
};

// Green / blue: the main action of a screen (strong fill, white text); red: deleting; yellow:
// leaving; gray / outline: everything else. (The palette flips in dark mode, see global.css.)
const variantClasses: Record<ButtonVariant, string> = {
    green: 'bg-green-600 border-green-600 active:bg-green-700 active:border-green-700',
    blue: 'bg-blue-600 border-blue-600 active:bg-blue-700 active:border-blue-700',
    yellow: 'bg-yellow-300 border-yellow-500 active:bg-yellow-500 active:border-yellow-300',
    red: 'bg-red-600 border-red-600 active:bg-red-700 active:border-red-700',
    gray: 'bg-gray-200 border-gray-400 active:bg-gray-400 active:border-gray-200',
    outline: 'bg-white border-gray-300 active:bg-gray-100',
};

const textClasses: Record<ButtonVariant, string> = {
    green: 'text-white',
    blue: 'text-white',
    yellow: 'text-gray-900',
    red: 'text-white',
    gray: 'text-gray-900',
    outline: 'text-gray-900',
};

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
    sm: { container: 'min-h-8 px-2 py-1', text: 'text-sm' },
    md: { container: 'min-h-11 px-4 py-2', text: 'text-base' },
};

export function Button({
    label,
    onPress,
    variant = 'green',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    accessibilityLabel,
    testID,
}: ButtonProps) {
    const { text } = useTheme();
    const inactive = disabled || loading;
    const sizes = sizeClasses[size];

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{ disabled: inactive, busy: loading }}
            disabled={inactive}
            onPress={onPress}
            testID={testID}
            // Disabled: its own colour, faded (not gray, which looks like a secondary button).
            className={`flex-row items-center justify-center rounded-md border-2 ${sizes.container} ${variantClasses[variant]} ${disabled ? 'opacity-40' : ''} ${className}`}
        >
            {loading ? (
                <ActivityIndicator size="small" color={text} />
            ) : (
                <Text className={`font-semibold ${textClasses[variant]} ${sizes.text}`}>{label}</Text>
            )}
        </Pressable>
    );
}

export default Button;

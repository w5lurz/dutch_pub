import { ActivityIndicator, Pressable, Text } from 'react-native';

export type ButtonVariant = 'green' | 'blue' | 'yellow' | 'red' | 'gray';
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

// Same palette as the web button: light fill + darker border, swapped while pressed.
const variantClasses: Record<ButtonVariant, string> = {
    green: 'bg-green-300 border-green-500 active:bg-green-500 active:border-green-300',
    blue: 'bg-blue-300 border-blue-500 active:bg-blue-500 active:border-blue-300',
    yellow: 'bg-yellow-300 border-yellow-500 active:bg-yellow-500 active:border-yellow-300',
    red: 'bg-red-300 border-red-500 active:bg-red-500 active:border-red-300',
    gray: 'bg-gray-200 border-gray-400 active:bg-gray-400 active:border-gray-200',
};

const disabledClasses = 'bg-gray-300 border-gray-500 opacity-60';

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
            className={`flex-row items-center justify-center rounded-md border-2 ${sizes.container} ${
                disabled ? disabledClasses : variantClasses[variant]
            } ${className}`}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#1f2937" />
            ) : (
                <Text className={`font-medium text-gray-900 ${sizes.text}`}>{label}</Text>
            )}
        </Pressable>
    );
}

export default Button;

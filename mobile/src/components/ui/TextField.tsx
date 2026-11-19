import { useId, useState, type ComponentRef, type Ref } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/lib/theme';

import { IconButton } from './IconButton';

export type TextFieldProps = TextInputProps & {
    label?: string;
    /** Shown in red under the input; also turns the border red. */
    error?: string | null;
    /** Classes for the wrapping View (label + input + error). */
    containerClassName?: string;
    ref?: Ref<ComponentRef<typeof TextInput>>;
    /**
     * With `secureTextEntry` (a password): an eye button on the right shows / hides the text.
     * Default true; false hides the button.
     */
    revealable?: boolean;
};

/**
 * Labelled text input. All `TextInputProps` (and `ref`) are forwarded to the TextInput. A
 * password field (`secureTextEntry`) gets a show / hide button on the right (`revealable`).
 */
export function TextField({
    label,
    error,
    containerClassName = '',
    className = '',
    ref,
    revealable = true,
    secureTextEntry,
    ...inputProps
}: TextFieldProps) {
    const colors = useTheme();
    const id = useId();
    const [revealed, setRevealed] = useState(false);
    const toggle = !!secureTextEntry && revealable;

    return (
        <View className={`w-full gap-1 ${containerClassName}`}>
            {label ? (
                <Text nativeID={`${id}-label`} className="text-sm font-medium text-gray-900">
                    {label}
                </Text>
            ) : null}
            <View className="justify-center">
                <TextInput
                    ref={ref}
                    accessibilityLabel={inputProps.accessibilityLabel ?? label}
                    accessibilityLabelledBy={label ? `${id}-label` : undefined}
                    accessibilityHint={error ?? inputProps.accessibilityHint}
                    placeholderTextColor={colors.placeholder}
                    className={`rounded-md border bg-gray-50 p-2.5 text-base text-gray-900 ${
                        error ? 'border-red-500' : 'border-gray-300'
                    } ${toggle ? 'pr-12' : ''} ${className}`}
                    secureTextEntry={!!secureTextEntry && !(toggle && revealed)}
                    {...inputProps}
                />
                {toggle ? (
                    <IconButton
                        icon={revealed ? 'eye-off-outline' : 'eye-outline'}
                        accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
                        onPress={() => setRevealed(current => !current)}
                        disabled={inputProps.editable === false}
                        className="absolute right-0.5"
                    />
                ) : null}
            </View>
            {error ? (
                <Text accessibilityLiveRegion="polite" className="text-sm text-red-600">
                    {error}
                </Text>
            ) : null}
        </View>
    );
}

export default TextField;

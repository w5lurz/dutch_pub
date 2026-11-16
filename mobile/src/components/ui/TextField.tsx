import { useId, type ComponentRef, type Ref } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

export type TextFieldProps = TextInputProps & {
    label?: string;
    /** Shown in red under the input; also turns the border red. */
    error?: string | null;
    /** Classes for the wrapping View (label + input + error). */
    containerClassName?: string;
    ref?: Ref<ComponentRef<typeof TextInput>>;
};

/** Labelled text input. All `TextInputProps` (and `ref`) are forwarded to the TextInput. */
export function TextField({ label, error, containerClassName = '', className = '', ref, ...inputProps }: TextFieldProps) {
    const id = useId();

    return (
        <View className={`w-full gap-1 ${containerClassName}`}>
            {label ? (
                <Text nativeID={`${id}-label`} className="text-sm font-medium text-gray-900">
                    {label}
                </Text>
            ) : null}
            <TextInput
                ref={ref}
                accessibilityLabel={inputProps.accessibilityLabel ?? label}
                accessibilityLabelledBy={label ? `${id}-label` : undefined}
                accessibilityHint={error ?? inputProps.accessibilityHint}
                placeholderTextColor="#9ca3af"
                className={`rounded-md border bg-gray-50 p-2.5 text-base text-gray-900 ${
                    error ? 'border-red-500' : 'border-gray-300'
                } ${className}`}
                {...inputProps}
            />
            {error ? (
                <Text accessibilityLiveRegion="polite" className="text-sm text-red-600">
                    {error}
                </Text>
            ) : null}
        </View>
    );
}

export default TextField;

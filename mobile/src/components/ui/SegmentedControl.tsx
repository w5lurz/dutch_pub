import { Pressable, Text, View } from 'react-native';

export type SegmentedOption<T extends string | number> = {
    label: string;
    value: T;
    /** Optional colour shown as a small dot before the label (e.g. card back colours). */
    swatch?: string;
};

export type SegmentedControlProps<T extends string | number> = {
    options: readonly SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
    className?: string;
    accessibilityLabel?: string;
};

/** A row of mutually exclusive options (e.g. room slots, visibility). */
export function SegmentedControl<T extends string | number>({
    options,
    value,
    onChange,
    disabled = false,
    className = '',
    accessibilityLabel,
}: SegmentedControlProps<T>) {
    return (
        <View
            accessibilityRole="radiogroup"
            accessibilityLabel={accessibilityLabel}
            className={`flex-row rounded-md border border-gray-300 bg-gray-100 p-0.5 ${disabled ? 'opacity-60' : ''} ${className}`}
        >
            {options.map(option => {
                const selected = option.value === value;
                return (
                    <Pressable
                        key={String(option.value)}
                        accessibilityRole="radio"
                        accessibilityLabel={option.label}
                        accessibilityState={{ selected, checked: selected, disabled }}
                        disabled={disabled}
                        onPress={() => {
                            if (!selected) onChange(option.value);
                        }}
                        // Don't toggle shadow-*/ring-*/transition-* classes here: NativeWind builds
                        // them from CSS variables, and adding them after the first render makes it
                        // "upgrade" the component. In dev that prints a warning which serializes
                        // the props and crashes inside Expo Router ("Couldn't find a LinkingContext
                        // context"). Plain colour/border changes are safe.
                        className={`min-h-9 flex-1 items-center justify-center rounded border px-2 py-1.5 ${
                            selected ? 'border-gray-300 bg-white' : 'border-transparent active:bg-gray-200'
                        }`}
                    >
                        <View className="flex-row items-center gap-1.5">
                            {option.swatch ? (
                                <View
                                    testID={`swatch-${String(option.value)}`}
                                    className="h-3 w-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: option.swatch }}
                                />
                            ) : null}
                            <Text className={`text-sm ${selected ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{option.label}</Text>
                        </View>
                    </Pressable>
                );
            })}
        </View>
    );
}

export default SegmentedControl;

import { Text, View } from 'react-native';

import { SegmentedControl, type SegmentedOption } from './SegmentedControl';

export type ChoiceRowProps<T extends string | number> = {
    label: string;
    /** One line under the label explaining what the setting does. */
    description?: string;
    options: readonly SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    /** Shows the value read-only (e.g. for players who don't own the room). */
    disabled?: boolean;
    className?: string;
    testID?: string;
};

/**
 * A labelled one-of-a-few setting, laid out like `SettingRow`: label and description on the
 * left, a small segmented control (a radio group named after the label) on the right.
 */
export function ChoiceRow<T extends string | number>({
    label,
    description,
    options,
    value,
    onChange,
    disabled = false,
    className = '',
    testID,
}: ChoiceRowProps<T>) {
    return (
        <View testID={testID} className={`min-h-12 flex-row items-center gap-3 py-1 ${className}`}>
            <View className="flex-1 gap-0.5">
                <Text className="text-base font-medium text-gray-900">{label}</Text>
                {description ? <Text className="text-sm text-gray-700">{description}</Text> : null}
            </View>
            <SegmentedControl
                options={options}
                value={value}
                onChange={onChange}
                disabled={disabled}
                accessibilityLabel={label}
                className="w-40"
            />
        </View>
    );
}

export default ChoiceRow;

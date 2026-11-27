import { Pressable, Switch, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

export type SettingRowProps = {
    label: string;
    /** One line under the label explaining what the setting does. */
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    /** Shows the value read-only (e.g. for players who don't own the room). */
    disabled?: boolean;
    className?: string;
    testID?: string;
};

/** A labelled on / off setting: label and description on the left, a `Switch` on the right. Tapping the row toggles it. */
export function SettingRow({ label, description, value, onValueChange, disabled = false, className = '', testID }: SettingRowProps) {
    const colors = useTheme();
    const toggle = () => {
        if (!disabled) onValueChange(!value);
    };

    return (
        <Pressable
            accessibilityRole="switch"
            accessibilityLabel={label}
            accessibilityHint={description}
            accessibilityState={{ checked: value, disabled }}
            disabled={disabled}
            onPress={toggle}
            testID={testID}
            className={`min-h-12 flex-row items-center gap-3 py-1 ${className}`}
        >
            <View className="flex-1 gap-0.5">
                <Text className="text-base font-medium text-gray-900">{label}</Text>
                {description ? <Text className="text-sm text-gray-700">{description}</Text> : null}
            </View>
            {/* The row carries the accessibility role; the Switch is just the visual. */}
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ false: colors.placeholder, true: colors.accent }}
                ios_backgroundColor={colors.placeholder}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            />
        </Pressable>
    );
}

export default SettingRow;

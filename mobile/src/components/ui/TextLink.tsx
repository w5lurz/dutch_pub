import { Pressable, Text } from 'react-native';

export type TextLinkProps = {
    label: string;
    onPress: () => void;
    /** Accessibility hint, e.g. "Opens in the browser". */
    hint?: string;
    className?: string;
};

/** An underlined text link (e.g. "Privacy policy"). */
export function TextLink({ label, onPress, hint, className = '' }: TextLinkProps) {
    return (
        <Pressable accessibilityRole="link" accessibilityLabel={label} accessibilityHint={hint} onPress={onPress} hitSlop={8} className={className}>
            <Text className="text-sm font-medium text-blue-600 underline">{label}</Text>
        </Pressable>
    );
}

export default TextLink;

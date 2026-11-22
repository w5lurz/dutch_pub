import { Pressable, Text } from 'react-native';

export type TextLinkProps = {
    label: string;
    onPress: () => void;
    /** Accessibility hint, e.g. "Opens in the browser". */
    hint?: string;
    /** `danger`: red (e.g. "Delete account"); default: the link blue. */
    tone?: 'link' | 'danger';
    /** Accessibility role; default `link` (a page opens). Use `button` for an action. */
    role?: 'link' | 'button';
    className?: string;
};

/** An underlined text link (e.g. "Privacy policy"). */
export function TextLink({ label, onPress, hint, tone = 'link', role = 'link', className = '' }: TextLinkProps) {
    return (
        <Pressable accessibilityRole={role} accessibilityLabel={label} accessibilityHint={hint} onPress={onPress} hitSlop={8} className={`active:opacity-60 ${className}`}>
            <Text className={`text-sm font-medium underline ${tone === 'danger' ? 'text-red-600' : 'text-blue-600'}`}>{label}</Text>
        </Pressable>
    );
}

export default TextLink;

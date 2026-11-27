import { Pressable, Text, View } from 'react-native';

export type AuthSwitchLinkProps = {
    /** Plain lead-in text, e.g. "Don’t have an account yet?". */
    prompt: string;
    /** Link text, e.g. "Sign up". */
    label: string;
    onPress: () => void;
};

/** "Don’t have an account yet? Sign up" style line linking the login and registration screens. */
export function AuthSwitchLink({ prompt, label, onPress }: AuthSwitchLinkProps) {
    return (
        <View className="flex-row flex-wrap items-center">
            <Text className="text-sm font-light text-gray-500">{prompt} </Text>
            <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={onPress} hitSlop={8}>
                <Text className="text-sm font-medium text-blue-600 underline">{label}</Text>
            </Pressable>
        </View>
    );
}

export default AuthSwitchLink;

import { Pressable, Text, View } from 'react-native';
import { AVATAR_IDS, generatedAvatarId, type AvatarId } from '@dutch-pub/shared';

import { Avatar } from './Avatar';
import { avatarName } from './avatars/AvatarArt';
import { Button } from './Button';

export type AvatarPickerProps = {
    /** Whose avatars (backgrounds and the generated one follow the name). */
    username: string;
    /** The chosen avatar, or null while the generated one is used. */
    value: AvatarId | null;
    onChange: (avatar: AvatarId | null) => void;
    disabled?: boolean;
    /** Diameter of each preset in dp. Default 52. */
    itemSize?: number;
};

/**
 * A grid of the preset avatars plus "Use my generated one". The current choice is framed
 * (only the border colour toggles, see AGENTS.md); with nothing chosen, the generated
 * avatar is framed and marked.
 */
export function AvatarPicker({ username, value, onChange, disabled = false, itemSize = 52 }: AvatarPickerProps) {
    const generated = generatedAvatarId(username);
    const shown = value ?? generated;

    return (
        <View className="w-full gap-3">
            <View className="flex-row flex-wrap justify-center gap-2" accessibilityRole="radiogroup" accessibilityLabel="Avatars">
                {AVATAR_IDS.map(id => {
                    const selected = id === shown;
                    const isGenerated = id === generated;
                    return (
                        <Pressable
                            key={id}
                            accessibilityRole="radio"
                            accessibilityLabel={`${avatarName(id)}${isGenerated ? ', your generated avatar' : ''}`}
                            accessibilityState={{ selected, disabled }}
                            disabled={disabled}
                            onPress={() => onChange(id)}
                            className={`rounded-full border-4 p-0.5 active:opacity-70 ${selected ? 'border-blue-500' : 'border-transparent'} ${
                                disabled ? 'opacity-60' : ''
                            }`}
                        >
                            <Avatar username={username} avatar={id} size={itemSize} />
                        </Pressable>
                    );
                })}
            </View>
            <View className="items-center gap-1">
                <Button
                    label="Use my generated one"
                    variant="gray"
                    size="sm"
                    disabled={disabled || value === null}
                    onPress={() => onChange(null)}
                />
                <Text className="text-center text-xs text-gray-500">
                    {value === null
                        ? `You are using the avatar generated from your name (${avatarName(generated)}).`
                        : `Generated from your name: ${avatarName(generated)}.`}
                </Text>
            </View>
        </View>
    );
}

export default AvatarPicker;

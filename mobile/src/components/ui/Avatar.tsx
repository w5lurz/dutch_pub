import { View } from 'react-native';
import Svg from 'react-native-svg';
import { avatarFor } from '@dutch-pub/shared';

import { AVATAR_ART, avatarName } from './avatars/AvatarArt';

export type AvatarProps = {
    /** Whose avatar: decides the generated one and the background colour. */
    username: string;
    /** The chosen avatar id (null / missing / unknown: the one generated from the name). */
    avatar?: string | null;
    /** Diameter in dp. */
    size: number;
    /**
     * Read out by screen readers. Without it the avatar is decorative (a picture without
     * text, skipped by them), e.g. next to the name that already says who it is.
     */
    accessibilityLabel?: string;
};

/**
 * A player's avatar: their chosen preset, or the one generated from their name
 * (`avatarFor`, the same on every device), on a background colour from the name.
 * Drawn locally (react-native-svg), no network. Fixed colours, like card faces.
 */
export function Avatar({ username, avatar, size, accessibilityLabel }: AvatarProps) {
    const look = avatarFor(username, avatar);
    const Art = AVATAR_ART[look.id];
    return (
        <View
            testID={`avatar-${look.id}`}
            accessible={!!accessibilityLabel}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={accessibilityLabel ? 'image' : undefined}
            style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: look.background, overflow: 'hidden' }}
        >
            <Svg width={size} height={size} viewBox="0 0 100 100">
                <Art />
            </Svg>
        </View>
    );
}

/** E.g. "Fox avatar" or "Fox avatar (generated from the name)". */
export const describeAvatar = (username: string, avatar?: string | null) => {
    const look = avatarFor(username, avatar);
    return `${avatarName(look.id)} avatar${look.generated ? ' (generated from the name)' : ''}`;
};

export default Avatar;

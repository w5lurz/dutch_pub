import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import type { AvatarId } from '@dutch-pub/shared';

import { Avatar, AvatarPicker, describeAvatar } from '@/components/ui';

/**
 * Dev-only preview of the avatars (UI-PLAN.md U6): the picker as on the Account screen (not
 * saved), the avatar at the sizes the app uses, and the generated avatars of a few names.
 * Open it from the Account tab (dev builds only) or at /dev/avatars in the browser.
 */

const NAMES = ['Tamás', 'Julcsi', 'lacika', 'Bence', 'guest_42', 'kiskutya', 'Anna', 'test'];
const SIZES = [96, 52, 36, 24, 16];

export default function AvatarPreview() {
    const [chosen, setChosen] = useState<AvatarId | null>(null);
    if (!__DEV__) return <Redirect href="/" />;

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="items-center gap-6 p-4">
            <Text className="text-lg font-bold text-gray-900">Picker (for Tamás)</Text>
            <View className="flex-row items-end gap-3">
                {SIZES.map(size => (
                    <Avatar key={size} username="Tamás" avatar={chosen} size={size} />
                ))}
            </View>
            <Text className="text-sm text-gray-600">{describeAvatar('Tamás', chosen)}</Text>
            <View className="w-full max-w-md">
                <AvatarPicker username="Tamás" value={chosen} onChange={setChosen} />
            </View>
            <Text className="text-lg font-bold text-gray-900">Generated from names</Text>
            <View className="flex-row flex-wrap justify-center gap-4">
                {NAMES.map(name => (
                    <View key={name} className="items-center gap-1">
                        <Avatar username={name} size={52} />
                        <Text className="text-xs text-gray-700">{name}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@/lib/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type TabIconArgs = { focused: boolean; color: ColorValue; size: number };

/** `tabBarIcon` renderer: outline icon, filled when the tab is focused. */
const tabIcon = (name: IoniconName, focusedName: IoniconName) =>
    function TabBarIcon({ focused, color, size }: TabIconArgs) {
        return <Ionicons name={focused ? focusedName : name} color={typeof color === 'string' ? color : undefined} size={size} />;
    };

/** Bottom tabs. Header styled like the root Stack (gray-700, as the web navbar). */
export default function TabsLayout() {
    const colors = useTheme();
    const { t } = useTranslation();
    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: '#374151' },
                headerTintColor: '#ffffff',
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: '#6b7280', // gray-500, the middle of the scale: readable in both schemes
                tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
                sceneStyle: { backgroundColor: colors.surface },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{ title: t('tabs.home'), headerTitle: 'Dutch Pub', tabBarIcon: tabIcon('home-outline', 'home') }}
            />
            <Tabs.Screen name="play" options={{ title: t('tabs.play'), tabBarIcon: tabIcon('game-controller-outline', 'game-controller') }} />
            <Tabs.Screen
                name="leaderboard"
                options={{ title: t('tabs.leaderboard'), tabBarIcon: tabIcon('trophy-outline', 'trophy') }}
            />
            <Tabs.Screen
                name="account"
                options={{ title: t('tabs.account'), tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
            />
        </Tabs>
    );
}

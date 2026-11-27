import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { useTheme } from '@/lib/theme';

/**
 * The open / closed marker of a section that expands (Home's rules, the house rules): a chevron
 * in a round badge, big enough to notice. Decorative: the row itself is the button.
 */
export function ExpandIcon({ open }: { open: boolean }) {
    const { textMuted } = useTheme();
    return (
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={textMuted} />
        </View>
    );
}

export default ExpandIcon;

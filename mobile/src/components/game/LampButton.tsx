import { Pressable, Text, View } from 'react-native';
import i18n from '@/i18n';

import { LampIcon } from '@/components/icons';

import { useLampSwitch } from './tableTheme';

/**
 * The lamp switch on the table edge (UI-PLAN U5): tap to switch the lamp on (night) or off
 * (day), long press to follow the phone's dark mode again (shown by a small "A"). Only for
 * this player, remembered on the device.
 */
export function LampButton() {
    const lamp = useLampSwitch();
    return (
        <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: lamp.on }}
            accessibilityLabel={i18n.t(lamp.on ? (lamp.auto ? 'game.lamp.onAuto' : 'game.lamp.on') : lamp.auto ? 'game.lamp.offAuto' : 'game.lamp.off')}
            accessibilityHint={i18n.t('game.lamp.hint')}
            accessibilityActions={[{ name: 'longpress', label: i18n.t('game.lamp.followPhone') }]}
            onAccessibilityAction={event => event.nativeEvent.actionName === 'longpress' && lamp.followPhone()}
            onPress={lamp.toggle}
            onLongPress={lamp.followPhone}
            hitSlop={8}
            // Literal colours: the table's palette is inverted at night, the button should not be.
            style={{ backgroundColor: lamp.on ? '#1f2937' : '#ffffff', borderColor: lamp.on ? '#facc15' : '#9ca3af' }}
            className="h-12 w-12 items-center justify-center rounded-full border-2 shadow-md"
        >
            <LampIcon size={26} color={lamp.on ? '#fde68a' : '#4b5563'} glow={lamp.on ? '#facc15' : undefined} />
            {lamp.auto ? (
                <View
                    style={{ backgroundColor: lamp.on ? '#facc15' : '#4b5563' }}
                    className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full"
                >
                    <Text style={{ color: lamp.on ? '#1f2937' : '#ffffff' }} className="text-xs font-bold">
                        A
                    </Text>
                </View>
            ) : null}
        </Pressable>
    );
}

export default LampButton;

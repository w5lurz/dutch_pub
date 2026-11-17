import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Keyboard, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

export type KeyboardSpacerProps = {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
};

/**
 * Keeps its content above the on-screen keyboard: while the keyboard is up, it pads its bottom
 * by exactly the part of it the keyboard covers, measured on screen (its own bottom edge vs. the
 * keyboard's top). If the system already made room (Android resizing the window), that is 0, so
 * the room is never added twice. Used instead of KeyboardAvoidingView, which inside the chat
 * Modal gave too little or too much room depending on where it sat.
 */
export function KeyboardSpacer({ children, style }: KeyboardSpacerProps) {
    const ref = useRef<ComponentRef<typeof View> | null>(null);
    /** The keyboard's top edge on screen, or null while it is hidden. */
    const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
    /** This view's bottom edge on screen (the padding is inside, so it does not move it). */
    const [bottom, setBottom] = useState(0);

    const measure = () => ref.current?.measureInWindow((_x, y, _width, height) => setBottom(y + height));

    useEffect(() => {
        const ios = Platform.OS === 'ios';
        const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', event => {
            setKeyboardTop(event.endCoordinates.screenY);
            measure();
        });
        const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardTop(null));
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    const covered = keyboardTop === null ? 0 : Math.max(0, Math.round(bottom - keyboardTop));
    return (
        <View ref={ref} collapsable={false} onLayout={measure} style={[{ flex: 1, paddingBottom: covered }, style]}>
            {children}
        </View>
    );
}

export default KeyboardSpacer;

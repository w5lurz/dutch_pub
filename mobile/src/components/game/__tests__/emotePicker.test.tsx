import { fireEvent, render, screen } from '@testing-library/react-native';

import type { ViewRef } from '../CardDrag';
import { EmotePicker } from '../EmotePicker';

/** A view that measures as the given rect (window coordinates). */
const fakeView = (x: number, y: number, width: number, height: number) =>
    ({ measureInWindow: (callback: (...rect: number[]) => void) => callback(x, y, width, height) }) as unknown as ViewRef;
const views = (name: string | null) => (name === null ? fakeView(0, 0, 400, 800) : fakeView(150, 600, 100, 30));

describe('EmotePicker', () => {
    it('sends the chosen emotion, or just closes', async () => {
        const onPick = jest.fn();
        const onClose = jest.fn();
        await render(<EmotePicker username="me" viewOf={views} onPick={onPick} onClose={onClose} />);
        // Placed once your avatar is measured.
        const angry = await screen.findByTestId('emote-angry', { includeHiddenElements: true });
        expect(angry.props.accessibilityLabel).toBe('Angry');
        fireEvent.press(angry);
        expect(onPick).toHaveBeenCalledWith('angry');
        fireEvent.press(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

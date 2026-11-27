import { render, screen } from '@testing-library/react-native';

import type { ViewRef } from '../CardDrag';
import { EmoteFace } from '../EmoteFace';

/** A view that measures as the given rect (window coordinates). */
const fakeView = (x: number, y: number, width: number, height: number) =>
    ({ measureInWindow: (callback: (...rect: number[]) => void) => callback(x, y, width, height) }) as unknown as ViewRef;
const views = (name: string | null) => (name === null ? fakeView(0, 0, 400, 800) : fakeView(150, 600, 100, 30));

describe('EmoteFace', () => {
    it("shows a big copy of the player's avatar over their seat", async () => {
        await render(<EmoteFace name="Julcsi" avatarId="raccoon" shown={{ emote: 'angry', key: 1 }} viewOf={views} />);
        const face = await screen.findByTestId('avatar-raccoon', { includeHiddenElements: true });
        expect(face.props.style.width).toBeGreaterThanOrEqual(84);
    });
});

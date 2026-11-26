import { act, render, screen } from '@testing-library/react-native';
import type { Game } from '@dutch-pub/shared';

import { EMOTE_MS, showEmote, clearEmotes, useEmotes } from '@/lib/emotes';

import { pileDrawSignature } from '../autoDraw';
import type { ViewRef } from '../CardDrag';
import { EmoteBubble } from '../EmoteBubble';
import { PickUpBanner } from '../PickUpBanner';

/** A view that measures as `rect` (window coordinates). */
const fakeView = (x: number, y: number, width: number, height: number) =>
    ({ measureInWindow: (callback: (...rect: number[]) => void) => callback(x, y, width, height) }) as unknown as ViewRef;
const views = (name: string | null) => (name === null ? fakeView(0, 0, 400, 800) : fakeView(150, 600, 100, 30));

describe('PickUpBanner', () => {
    it("says who picked up the pile and how many cards", async () => {
        await render(<PickUpBanner pickedUp={{ username: 'Julcsi', count: 3 }} username="me" />);
        expect(screen.getByText('Julcsi', { includeHiddenElements: true })).toBeTruthy();
        expect(screen.getByText(/picked up the pile!/, { includeHiddenElements: true })).toBeTruthy();
        expect(screen.getByText('3 cards', { includeHiddenElements: true })).toBeTruthy();
    });

    it('says "You" for your own pick-up', async () => {
        await render(<PickUpBanner pickedUp={{ username: 'me', count: 1 }} username="me" />);
        expect(screen.getByText('You picked up the pile!', { includeHiddenElements: true })).toBeTruthy();
        expect(screen.getByText('1 card', { includeHiddenElements: true })).toBeTruthy();
    });
});

describe('the pause after a pick-up', () => {
    it('picks up nothing by itself meanwhile', () => {
        const game: Game = {
            userCards: { hand: [{ name: '3', value: 3, color: 'hearts' }], table: 3, tableFlipped: [] },
            opponents: { Julcsi: { hand: 5, table: 3, tableFlipped: [] } },
            deck: 0,
            laidCards: [{ name: 'K', value: 13, color: 'clubs' }],
            burntCards: null,
            active: true,
        };
        expect(pileDrawSignature(1, game)).not.toBeNull();
        expect(pileDrawSignature(1, { ...game, pickedUp: { username: 'Julcsi', count: 4 } })).toBeNull();
    });
});

describe('emotes', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
        // Ends the bubbles and their animations before the real timers are back (later tests hung on them).
        act(() => {
            clearEmotes();
            jest.runOnlyPendingTimers();
        });
        screen.unmount();
        jest.useRealTimers();
    });

    function Shown() {
        const emotes = useEmotes();
        return <>{Object.entries(emotes).map(([name, shown]) => <EmoteBubble key={`${name}-${shown.key}`} name={name} emote={shown.emote} viewOf={views} />)}</>;
    }

    it('shows an emotion above the player for a few seconds; a newer one replaces it', async () => {
        await render(<Shown />);
        await act(async () => showEmote({ username: 'Julcsi', emote: 'hello' }));
        expect(screen.getByLabelText('Julcsi: Hello')).toBeTruthy();
        expect(screen.getByText('👋', { includeHiddenElements: true })).toBeTruthy();

        await act(async () => showEmote({ username: 'Julcsi', emote: 'thumbsUp' }));
        expect(screen.queryByLabelText('Julcsi: Hello')).toBeNull();
        expect(screen.getByLabelText('Julcsi: Thumbs up')).toBeTruthy();

        await act(async () => jest.advanceTimersByTime(EMOTE_MS + 50));
        expect(screen.queryByLabelText('Julcsi: Thumbs up')).toBeNull();
    });
});

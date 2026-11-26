import { act, render, screen } from '@testing-library/react-native';
import type { Game } from '@dutch-pub/shared';

import { Avatar } from '@/components/ui';
import { EMOTE_MS, showEmote, clearEmotes } from '@/lib/emotes';

import { pileDrawSignature } from '../autoDraw';
import { PickUpBanner } from '../PickUpBanner';
import { SeatAvatar } from '../Seat';
import { WinBanner } from '../WinBanner';
import { cansFor, MAX_CANS } from '../TableCans';

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

describe('WinBanner', () => {
    it('says who won, or that you did', async () => {
        const other = await render(<WinBanner winner="Julcsi" username="me" />);
        expect(other.getByText('Julcsi', { includeHiddenElements: true })).toBeTruthy();
        expect(other.getByText(/won the game!/, { includeHiddenElements: true })).toBeTruthy();
        expect(other.getByText('Congratulations!', { includeHiddenElements: true })).toBeTruthy();
        await other.unmount();
        const mine = await render(<WinBanner winner="me" username="me" />);
        expect(mine.getByText('🏆 You won the game!', { includeHiddenElements: true })).toBeTruthy();
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

describe('avatar moods', () => {
    it('draws every avatar with every mood', async () => {
        for (const avatar of ['cat', 'fox', 'panda', 'sheep', 'owl']) {
            for (const mood of ['hello', 'angry', 'relieved', 'thumbsUp', null] as const) {
                const drawn = await render(<Avatar username="x" avatar={avatar} size={40} mood={mood} />);
                expect(drawn.getByTestId(`avatar-${avatar}`, { includeHiddenElements: true })).toBeTruthy();
                await drawn.unmount();
            }
        }
    });
});

describe('emotions at the seat', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
        act(() => {
            clearEmotes();
            jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
    });

    it("the player's avatar shows the emotion for a few seconds; a newer one replaces it", async () => {
        await render(<SeatAvatar name="Julcsi" active={false} size={40} avatarId="fox" />);
        const said = (text: string) => screen.queryByText(text, { includeHiddenElements: true });
        await act(async () => showEmote({ username: 'Julcsi', emote: 'hello' }));
        expect(said('Julcsi: Hello')).toBeTruthy();

        await act(async () => showEmote({ username: 'Julcsi', emote: 'angry' }));
        expect(said('Julcsi: Hello')).toBeNull();
        expect(said('Julcsi: Angry')).toBeTruthy();

        // Someone else's emotion doesn't show here.
        await act(async () => showEmote({ username: 'Tamás', emote: 'thumbsUp' }));
        expect(said('Tamás: Thumbs up')).toBeNull();

        await act(async () => jest.advanceTimersByTime(EMOTE_MS + 50));
        expect(said('Julcsi: Angry')).toBeNull();
    });
});

describe('cans on the table', () => {
    it('one can per game in a row from the second game, beer and cola taking turns, at most eight', () => {
        expect(cansFor(undefined)).toEqual([]);
        expect(cansFor(1)).toEqual([]);
        expect(cansFor(2)).toEqual(['beer', 'cola']);
        expect(cansFor(3)).toEqual(['beer', 'cola', 'beer']);
        expect(cansFor(30)).toHaveLength(MAX_CANS);
    });
});

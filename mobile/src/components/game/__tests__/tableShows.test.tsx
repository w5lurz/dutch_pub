import { act, render, screen } from '@testing-library/react-native';
import type { Game } from '@dutch-pub/shared';

import { bigPickUp, handCounts } from '../bigPickUp';
import { glassPath } from '../GameTable';
import { Librarian, LIBRARIAN_MS } from '../Librarian';
import { ShotGlass } from '../ShotGlass';

const game = (hand: number, opponentHand: number, laid: number): Game => ({
    userCards: { hand: Array.from({ length: hand }, () => ({ name: '5', value: 5, color: 'hearts' })), table: 3, tableFlipped: [] },
    opponents: { Julcsi: { hand: opponentHand, table: 3, tableFlipped: [] } },
    deck: 10,
    laidCards: laid ? Array.from({ length: laid }, () => ({ name: '7', value: 7, color: 'clubs' })) : null,
    burntCards: null,
});

describe('bigPickUp', () => {
    it('finds whoever picked up more than six cards, you or an opponent', () => {
        expect(bigPickUp(handCounts(game(3, 3, 7), 'me'), handCounts(game(10, 3, 0), 'me'))).toEqual({ name: 'me', count: 7 });
        expect(bigPickUp(handCounts(game(3, 2, 9), 'me'), handCounts(game(3, 11, 0), 'me'))).toEqual({ name: 'Julcsi', count: 9 });
    });

    it('ignores small pick-ups, played cards and a pile that is still there', () => {
        expect(bigPickUp(handCounts(game(3, 3, 6), 'me'), handCounts(game(9, 3, 0), 'me'))).toBeNull();
        expect(bigPickUp(handCounts(game(3, 3, 7), 'me'), handCounts(game(3, 3, 8), 'me'))).toBeNull();
        expect(bigPickUp(handCounts(game(0, 3, 0), 'me'), handCounts(game(9, 3, 1), 'me'))).toBeNull();
    });
});

describe('glassPath', () => {
    const root = { x: 0, y: 0, width: 400, height: 800 };
    it('stops beside a seat, on the side facing the middle', () => {
        expect(glassPath(root, { x: 10, y: 300, width: 60, height: 100 }).to).toEqual({ x: 106, y: 350 });
        expect(glassPath(root, { x: 330, y: 300, width: 60, height: 100 }).to).toEqual({ x: 294, y: 350 });
        expect(glassPath(root, { x: 150, y: 600, width: 100, height: 30 }).to).toEqual({ x: 286, y: 615 });
    });
    it('starts in the middle and stays on the table', () => {
        const path = glassPath(root, { x: 330, y: 0, width: 80, height: 20 });
        expect(path.from).toEqual({ x: 200, y: 400 });
        expect(path.to.y).toBe(30);
    });
});

describe('Librarian', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("shows who picked up the pile, then goes", async () => {
        const onDone = jest.fn();
        await render(<Librarian name="Julcsi" count={8} onDone={onDone} />);
        expect(screen.getByText('Julcsi', { includeHiddenElements: true })).toBeTruthy();
        expect(screen.getByText(/is the librarian now/, { includeHiddenElements: true })).toBeTruthy();
        await act(async () => jest.advanceTimersByTime(LIBRARIAN_MS + 100));
        expect(onDone).toHaveBeenCalledTimes(1);
    });
});

describe('ShotGlass', () => {
    it('renders without touches', async () => {
        await render(<ShotGlass from={{ x: 200, y: 400 }} to={{ x: 100, y: 300 }} />);
        expect(screen.getByTestId('shot-glass', { includeHiddenElements: true }).props.pointerEvents).toBe('none');
    });
});

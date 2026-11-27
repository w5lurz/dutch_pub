import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { measure, useCardDrag, type Rect, type ViewRef } from './CardDrag';
import type { EnterFrom } from './DraggableCard';

/** Pause between several cards drawn at once, so they come one after the other. */
const STAGGER_MS = 70;

type Seen = { ids: ReadonlySet<string>; laid: number; board: Rect | null; deck: Rect | null; laidRect: Rect | null };

/**
 * Lets the cards that just came into your hand fly in from where they came from: the laid
 * pile when you picked it up (it emptied), otherwise the deck. Cards present at the first
 * render (dealt, or the screen just opened) don't fly; nor does anything with "reduce motion".
 *
 * Attach `boardRef` to your board, whose bottom edge the hand sits on. After each change the
 * hand and the piles are measured and remembered (state), so the next change compares with
 * them: every render of that change (StrictMode renders twice) sees the same "new" cards, and
 * the flight is fixed when the card mounts.
 */
export function useDrawnCards(ids: readonly string[], laidCount: number) {
    const { deckRef, dropZoneRef } = useCardDrag();
    const still = useReducedMotion();
    const boardRef = useRef<ViewRef | null>(null);
    const [seen, setSeen] = useState<Seen | null>(null);
    const idsKey = ids.join('|');

    useEffect(() => {
        let cancelled = false;
        Promise.all([measure(boardRef.current), measure(deckRef.current), measure(dropZoneRef.current)]).then(
            ([board, deck, laidRect]) => {
                if (!cancelled) setSeen({ ids: new Set(idsKey ? idsKey.split('|') : []), laid: laidCount, board, deck, laidRect });
            },
        );
        return () => {
            cancelled = true;
        };
    }, [idsKey, laidCount, deckRef, dropZoneRef]);

    const source = seen && seen.laid > 0 && laidCount === 0 ? seen.laidRect : seen?.deck;
    const newIds = seen ? ids.filter(id => !seen.ids.has(id)) : [];

    /**
     * Where card `id` flies in from, given its centre (x from the board's left edge, y from the
     * board's bottom edge, negative = above it) and its width; undefined if it was already there.
     */
    const enterFrom = (id: string, centreX: number, centreYFromBottom: number, cardWidth: number): EnterFrom | undefined => {
        const index = newIds.indexOf(id);
        if (still || index < 0 || !source || !seen?.board) return undefined;
        const x = seen.board.x + centreX;
        const y = seen.board.y + seen.board.height + centreYFromBottom;
        return {
            dx: Math.round(source.x + source.width / 2 - x),
            dy: Math.round(source.y + source.height / 2 - y),
            scale: Math.max(0.6, Math.min(1.6, source.width / cardWidth)),
            delay: index * STAGGER_MS,
        };
    };

    return { boardRef, enterFrom };
}

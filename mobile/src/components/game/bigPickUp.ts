import { useCallback, useEffect, useRef, useState } from 'react';
import type { Game } from '@dutch-pub/shared';

/** Picking up more than this many cards at once calls the librarian. */
export const BIG_PICK_UP = 6;

/** Cards in every player's hand (you under your username) and on the laid pile. */
export type HandCounts = { laid: number; hands: Record<string, number> };

export function handCounts(game: Game, username?: string): HandCounts {
    const hands: Record<string, number> = Object.fromEntries(Object.entries(game.opponents).map(([name, opponent]) => [name, opponent.hand]));
    if (username) hands[username] = game.userCards.hand.length;
    return { laid: game.laidCards?.length ?? 0, hands };
}

/**
 * Who just picked up the pile with more than `BIG_PICK_UP` cards, comparing two game states:
 * the pile is empty now and their hand grew by that much (a pick-up, or a failed blind card
 * plus the pile). Every device sees the same states, so everyone gets the same answer.
 */
export function bigPickUp(previous: HandCounts, next: HandCounts): { name: string; count: number } | null {
    if (next.laid !== 0) return null;
    for (const [name, count] of Object.entries(next.hands)) {
        const before = previous.hands[name];
        if (before !== undefined && count - before > BIG_PICK_UP) return { name, count: count - before };
    }
    return null;
}

export type BigPickUp = { name: string; count: number; key: number };

/**
 * The latest big pick-up in the running game (see `bigPickUp`), until `hide` is called. The
 * first state seen (the deal, or opening the screen mid-game) never counts.
 */
export function useBigPickUp(game: Game, username?: string): [BigPickUp | null, () => void] {
    const [shown, setShown] = useState<BigPickUp | null>(null);
    const previous = useRef<HandCounts | null>(null);
    const countsKey = JSON.stringify(handCounts(game, username));
    useEffect(() => {
        const next = JSON.parse(countsKey) as HandCounts;
        const found = previous.current ? bigPickUp(previous.current, next) : null;
        previous.current = next;
        if (found) setShown({ ...found, key: Date.now() });
    }, [countsKey]);
    const hide = useCallback(() => setShown(null), []);
    return [shown, hide];
}

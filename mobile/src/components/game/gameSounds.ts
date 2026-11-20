import { useEffect, useRef } from 'react';
import type { Game } from '@dutch-pub/shared';

import { playSound, type SoundName } from '@/lib/sounds';

/** What changed between two views of the game, as a sound (or null: nothing to hear). */
export function soundFor(previous: Game, next: Game): SoundName | null {
    const laid = (game: Game) => game.laidCards?.length ?? 0;
    const burnt = (game: Game) => game.burntCards?.length ?? 0;
    if (burnt(next) > burnt(previous)) return 'burn';
    if (laid(next) > laid(previous)) return next.call && !previous.call ? 'call' : 'lay';
    // The pile was picked up (not burnt): it is gone and the cards went into a hand.
    if (laid(previous) > 0 && laid(next) === 0) return 'pickup';
    return null;
}

/**
 * Plays the table's sounds as the game changes: a card laid, an Ace's call, a burn, a pick-up,
 * and the win (`winner` set). Everyone hears every move, as at a real table.
 */
export function useGameSounds(game: Game, winner: string | null | undefined): void {
    const previous = useRef(game);
    useEffect(() => {
        const sound = soundFor(previous.current, game);
        previous.current = game;
        if (sound) playSound(sound);
    }, [game]);
    useEffect(() => {
        if (winner) playSound('win');
    }, [winner]);
}

import { hasAnyPlayableCard, type Game } from '@dutch-pub/shared';

/**
 * When it is the player's turn and none of their cards can be laid, they must pick up the
 * pile (`draw-cards`). Returns a signature of the state that requires it, or `null` when no
 * draw is needed. The caller emits once per distinct signature, so re-renders, StrictMode's
 * double effects and identical re-syncs (`game-state`) never send it twice.
 *
 * A player without any cards left has won (the server sends `game-won`), so no draw then.
 */
export function pileDrawSignature(roomId: number | undefined, game: Game): string | null {
    const { userCards, laidCards, active } = game;
    if (roomId === undefined || !active) return null;
    if (userCards.hand.length === 0 && userCards.tableFlipped.length === 0 && userCards.table === 0) return null;
    if (hasAnyPlayableCard(userCards, laidCards)) return null;
    return JSON.stringify([roomId, userCards.hand, userCards.tableFlipped, userCards.table, laidCards]);
}

import type { Game } from '@dutch-pub/shared';

/**
 * The value you may still add to the pile out of turn, or null: you laid its top card, nobody has
 * moved since (`game.addOnBy`) and you hold another card of it (e.g. a 7 drawn right after laying
 * a 7). The server lets such cards follow at once, as if laid together with the first.
 */
export function addOnValue(game: Game, username: string | undefined): number | null {
    const top = game.laidCards?.[0];
    if (!top || !username || game.active || game.addOnBy !== username || game.pickedUp || game.blindMiss || game.phase === 'swap') return null;
    const { hand, tableFlipped } = game.userCards;
    const pool = hand.length > 0 ? hand : tableFlipped;
    return pool.some((card) => card.value === top.value) ? top.value : null;
}

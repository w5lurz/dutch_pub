import type { TableLayout } from './cardSize';

/** Where an opponent sits around the table, seen from you (you always sit at the bottom). */
export type SeatPosition = 'left' | 'top-left' | 'top' | 'top-right' | 'right';

export type SeatAssignment = { name: string; position: SeatPosition };

/** Seats by number of opponents, in clockwise order (bottom → left → top → right). */
const SEATS: Record<TableLayout, Record<number, SeatPosition[]>> = {
    portrait: {
        1: ['top'],
        2: ['top-left', 'top-right'],
        3: ['left', 'top', 'right'],
    },
    wide: {
        1: ['top'],
        2: ['left', 'right'],
        3: ['left', 'top', 'right'],
    },
};

/**
 * Seats the opponents around the table in turn order, starting with the player after you,
 * so play goes clockwise like at a real table (you sit at the bottom):
 *
 * | Players | Portrait               | Wide                  |
 * |---------|------------------------|-----------------------|
 * | 2       | top                    | top                   |
 * | 3       | top-left, top-right    | left, right           |
 * | 4       | left, top, right       | left, top, right      |
 *
 * `playerOrder` is the turn order of all players (you included). If `me` is not in it,
 * the order is taken as starting after you. More than 3 opponents (not possible today)
 * fill the top between left and right.
 */
export function seatPositions(playerOrder: readonly string[], me: string | undefined, layout: TableLayout): SeatAssignment[] {
    const unique = playerOrder.filter((name, i) => playerOrder.indexOf(name) === i);
    const myIndex = me === undefined ? -1 : unique.indexOf(me);
    const opponents = myIndex < 0 ? unique : [...unique.slice(myIndex + 1), ...unique.slice(0, myIndex)];
    const count = opponents.length;
    const positions: SeatPosition[] =
        SEATS[layout][count] ?? (count === 0 ? [] : ['left', ...Array<SeatPosition>(Math.max(0, count - 2)).fill('top'), 'right']);
    return opponents.map((name, i) => ({ name, position: positions[i] }));
}

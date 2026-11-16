/** One rendered face-down card: `index` is what `lay-card` sends; `plus` the "+N" overlay. */
export type FaceDownSlot = { index: number; plus: number };

/**
 * The web's `renderFlippedCards`: at most 3 face-down cards are drawn; when there are more,
 * the 3rd one shows "+N" for the cards hidden behind it (N = count - 3, so 4 cards -> "+1").
 * Pressing a face-down card sends its position (0-2) as the face-down index.
 */
export function faceDownSlots(count: number): FaceDownSlot[] {
    const slots: FaceDownSlot[] = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
        slots.push({ index: i, plus: i === 2 && count > 3 ? count - 3 : 0 });
    }
    return slots;
}

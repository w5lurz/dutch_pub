/** Tilt between neighbouring cards in the hand (degrees). */
const DEG_PER_CARD = 6;
/** Largest total spread of the fan, first to last card (degrees). */
const MAX_SPREAD = 50;
/** Distance between neighbouring cards when there is plenty of room (share of a card width). */
const RELAXED_STEP = 0.62;
/** Radius of the arc the cards' centres lie on, in card heights (smaller = more curved). */
const ARC_RADIUS = 2.6;

export type HandArcCard = {
    /** Left / top of the card's (unrotated) box inside the hand area. */
    left: number;
    top: number;
    /** Tilt in degrees (negative = to the left). */
    rotation: number;
};

export type HandArcLayout = {
    cards: HandArcCard[];
    /** Height the hand area needs (the cards, the arc's drop at the ends, room for lifting). */
    height: number;
    /** Distance between neighbouring cards. */
    step: number;
};

const rad = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Positions of `count` cards held as a fan: their centres on a shallow arc, each tilted
 * along it, the whole fan centred in `available` dp. Cards are as far apart as is
 * comfortable (`RELAXED_STEP`); a long hand closes up to fit instead of scrolling (a phone
 * fits ~20 cards with each card's corner index still visible). `lift` is room kept above
 * the cards for a selected card.
 */
export function handArcLayout(
    count: number,
    cardWidth: number,
    cardHeight: number,
    available: number,
    lift = 0,
): HandArcLayout {
    if (count <= 0) return { cards: [], height: 0, step: 0 };
    const room = Math.max(cardWidth, available);
    const fitStep = count > 1 ? (room - cardWidth) / (count - 1) : 0;
    // The relaxed step if it fits, otherwise the step that fits (closer and closer, never scrolling).
    const step = count > 1 ? Math.min(cardWidth * RELAXED_STEP, fitStep) : 0;
    const spread = Math.min(MAX_SPREAD, (count - 1) * DEG_PER_CARD);
    const radius = cardHeight * ARC_RADIUS;
    const start = (room - (cardWidth + step * (count - 1))) / 2;

    const cards = Array.from({ length: count }, (_, i) => {
        const t = count > 1 ? i / (count - 1) - 0.5 : 0; // -0.5 ... 0.5
        const rotation = spread * t;
        const drop = radius * (1 - Math.cos(rad(rotation)));
        return { left: Math.round(start + i * step), top: Math.round(lift + drop), rotation };
    });
    const maxDrop = radius * (1 - Math.cos(rad(spread / 2)));
    // Tilted cards reach a little below their box: half the width times sin(angle).
    const tiltOverhang = (cardWidth / 2) * Math.sin(rad(spread / 2));
    return { cards, height: Math.ceil(lift + maxDrop + cardHeight + tiltOverhang), step };
}

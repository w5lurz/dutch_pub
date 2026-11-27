import { t } from 'i18next';
import type { TCard } from '@dutch-pub/shared';

// Card names come from the server in English ("Clear all", "J", "7"). The special cards get a
// name in the app's language; numbers and J / Q / K stay as printed on the card.

const SPECIAL = {
    'Start Over': 'startOver',
    Mirror: 'mirror',
    'You lose': 'youLose',
    'Clear all': 'clearAll',
    'Call Next': 'callNext',
} as const;

type SpecialKey = (typeof SPECIAL)[keyof typeof SPECIAL];

const specialKey = (name: string): SpecialKey | undefined => (Object.hasOwn(SPECIAL, name) ? SPECIAL[name as keyof typeof SPECIAL] : undefined);

/** The card's name in the app's language ("Clear all", "Alles weg", "7"). */
export function cardName(card: Pick<TCard, 'name'>): string {
    const key = specialKey(card.name);
    return key ? t(`cards.names.${key}`) : card.name;
}

/** The short form of a special card's name for small card stamps ("CLEAR"), or undefined. */
export function shortCardName(card: Pick<TCard, 'name'>): string | undefined {
    const key = specialKey(card.name);
    return key ? t(`cards.short.${key}`) : undefined;
}

/** The suit's name in the app's language. */
export function suitName(color: string): string {
    return ['clubs', 'diamonds', 'hearts', 'spades'].includes(color) ? t(`cards.suits.${color as 'clubs'}`) : color;
}

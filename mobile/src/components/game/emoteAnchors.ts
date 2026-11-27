import { createContext } from 'react';

import type { ViewRef } from './CardDrag';

/**
 * Each seat's avatar registers its view here (`SeatAvatar`), so the game table can show a player's
 * emotion as a big copy of their avatar right over it (`EmoteFace`). null: no table around.
 */
export const AvatarAnchors = createContext<((name: string, view: ViewRef | null) => void) | null>(null);

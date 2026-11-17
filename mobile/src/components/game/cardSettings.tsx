import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_ROOM_SETTINGS, type RoomSettings } from '@dutch-pub/shared';

/** The room settings that change how cards look (special-card stamps, back colour). */
export type CardSettings = Pick<RoomSettings, 'showCardPowers' | 'cardBack'>;

const DEFAULTS: CardSettings = { showCardPowers: DEFAULT_ROOM_SETTINGS.showCardPowers, cardBack: DEFAULT_ROOM_SETTINGS.cardBack };

const CardSettingsContext = createContext<CardSettings>(DEFAULTS);

/** Provides the room's card settings to every `PlayingCard` below (the game table). */
export function CardSettingsProvider({ settings, children }: { settings?: Partial<CardSettings>; children: ReactNode }) {
    const value: CardSettings = {
        showCardPowers: settings?.showCardPowers ?? DEFAULTS.showCardPowers,
        cardBack: settings?.cardBack ?? DEFAULTS.cardBack,
    };
    return <CardSettingsContext.Provider value={value}>{children}</CardSettingsContext.Provider>;
}

/** The current card settings (the room defaults outside a provider, e.g. in component tests). */
export function useCardSettings(): CardSettings {
    return useContext(CardSettingsContext);
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, type TextStyle } from 'react-native';

import { getDeviceSetting, setDeviceSetting } from '@/lib/deviceSettings';

export type TableMode = 'day' | 'night';
/** The lamp switch: follow the phone's dark mode (`auto`, the default), or always day / night. */
export type LampPreference = 'auto' | TableMode;

/**
 * Colours of the game table, which has its own look independent of the app's colour
 * scheme: a white garden table by day, at night lit by an outdoor lamp (see `TableLighting`).
 */
export type TableTheme = {
    mode: TableMode;
    /** Class that sets the CSS colour palette for everything on the table (global.css). */
    paletteClass: string;
    /** Overlay colour that fades cards you cannot play (an overlay, not opacity: see PlayingCard). */
    fadeColor: string;
    /** How strongly `fadeColor` covers a card: dimmed (cannot be laid now) or faded (not playable yet). */
    fadeAlpha: { dimmed: number; faded: number };
    /** Extra style for labels lying on the table (names, pile titles): a dark pill at night. */
    labelStyle?: TextStyle;
};

const DAY: TableTheme = {
    mode: 'day',
    paletteClass: 'light-palette',
    fadeColor: '#f9fafb', // card-face
    fadeAlpha: { dimmed: 0.6, faded: 0.3 },
};

const NIGHT: TableTheme = {
    mode: 'night',
    // Light text (the dark palette), on a dark pill so it reads on the lit table too.
    paletteClass: 'night-palette',
    // A softer fade than by day: dark on a dark table reads much heavier than white on white.
    fadeColor: '#1e293b',
    fadeAlpha: { dimmed: 0.38, faded: 0.22 },
    labelStyle: {
        backgroundColor: 'rgba(3, 7, 18, 0.55)',
        paddingHorizontal: 6,
        borderRadius: 8,
        overflow: 'hidden',
    },
};

export const TABLE_THEMES: Record<TableMode, TableTheme> = { day: DAY, night: NIGHT };

type TableThemeValue = TableTheme & {
    /** The lamp switch's setting (remembered on this device). */
    preference: LampPreference;
    setPreference: (preference: LampPreference) => void;
};

const TableThemeContext = createContext<TableThemeValue>({ ...DAY, preference: 'auto', setPreference: () => {} });

const SETTING = 'lamp';
const isPreference = (value: unknown): value is LampPreference => value === 'auto' || value === 'day' || value === 'night';
/** Loaded once per app run, so the table doesn't flash day before night on every game. */
let remembered: LampPreference | undefined;

/** Day or night for a lamp setting, given whether the phone is in dark mode. */
export function tableModeFor(preference: LampPreference, systemDark: boolean): TableMode {
    if (preference === 'auto') return systemDark ? 'night' : 'day';
    return preference;
}

/**
 * Sets the table theme for the game screen (and the preview screen). By default it follows
 * the lamp switch (`useLampSwitch`), which follows the phone's dark mode until switched; `mode`
 * fixes it instead (tests).
 */
export function TableThemeProvider({ mode, children }: { mode?: TableMode; children: ReactNode }) {
    const systemDark = useColorScheme() === 'dark';
    const [preference, setPreferenceState] = useState<LampPreference>(remembered ?? 'auto');

    useEffect(() => {
        if (remembered !== undefined) return;
        let cancelled = false;
        getDeviceSetting(SETTING).then(value => {
            remembered = isPreference(value) ? value : 'auto';
            if (!cancelled) setPreferenceState(remembered);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const setPreference = useCallback((next: LampPreference) => {
        remembered = next;
        setPreferenceState(next);
        void setDeviceSetting(SETTING, next);
    }, []);

    const value = useMemo(
        () => ({ ...TABLE_THEMES[mode ?? tableModeFor(preference, systemDark)], preference, setPreference }),
        [mode, preference, systemDark, setPreference],
    );
    return <TableThemeContext.Provider value={value}>{children}</TableThemeContext.Provider>;
}

/** The current table theme (day outside a provider, e.g. in component tests). */
export function useTableTheme(): TableTheme {
    return useContext(TableThemeContext);
}

/**
 * The lamp switch: `toggle` flips the table between day and night (for this player only,
 * remembered on the device); `followPhone` goes back to following the phone's dark mode.
 */
export function useLampSwitch() {
    const { mode, preference, setPreference } = useContext(TableThemeContext);
    return {
        on: mode === 'night',
        auto: preference === 'auto',
        toggle: () => setPreference(mode === 'night' ? 'day' : 'night'),
        followPhone: () => setPreference('auto'),
    };
}

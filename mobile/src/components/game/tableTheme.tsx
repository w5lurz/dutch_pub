import { createContext, useContext, type ReactNode } from 'react';

export type TableMode = 'day' | 'night';

/**
 * Colours of the game table, which has its own look independent of the app's colour
 * scheme (a white garden table; at night lit by a lamp, see UI-PLAN.md U5). Only `day`
 * is designed so far: `night` uses the same values until U5.
 */
export type TableTheme = {
    mode: TableMode;
    /** Class that sets the CSS colour palette for everything on the table (global.css). */
    paletteClass: string;
    /** Overlay colour that fades cards you cannot play (an overlay, not opacity: see PlayingCard). */
    fadeColor: string;
};

const DAY: TableTheme = {
    mode: 'day',
    paletteClass: 'light-palette',
    fadeColor: '#f9fafb', // card-face
};

const NIGHT: TableTheme = { ...DAY, mode: 'night' };

export const TABLE_THEMES: Record<TableMode, TableTheme> = { day: DAY, night: NIGHT };

const TableThemeContext = createContext<TableTheme>(DAY);

/** Sets the table theme for the game screen (and the preview screen). */
export function TableThemeProvider({ mode, children }: { mode: TableMode; children: ReactNode }) {
    return <TableThemeContext.Provider value={TABLE_THEMES[mode]}>{children}</TableThemeContext.Provider>;
}

/** The current table theme (day outside a provider, e.g. in component tests). */
export function useTableTheme(): TableTheme {
    return useContext(TableThemeContext);
}

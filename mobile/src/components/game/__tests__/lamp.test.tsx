import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { getDeviceSetting, setDeviceSetting } from '@/lib/deviceSettings';

import { Ashtray } from '../Ashtray';
import { LampButton } from '../LampButton';
import { Moth } from '../Moth';
import { lampDrop, TableLamp } from '../TableLamp';
import { TABLE_THEMES, tableModeFor, TableThemeProvider, useTableTheme } from '../tableTheme';

jest.mock('@/lib/deviceSettings', () => ({
    getDeviceSetting: jest.fn(async () => null),
    setDeviceSetting: jest.fn(async () => {}),
}));

function Mode() {
    const { mode, paletteClass } = useTableTheme();
    return <Text>{`${mode} ${paletteClass}`}</Text>;
}

const lamp = () => screen.getByRole('switch');

describe('tableModeFor', () => {
    it('follows the phone on auto, otherwise the switch', () => {
        expect(tableModeFor('auto', true)).toBe('night');
        expect(tableModeFor('auto', false)).toBe('day');
        expect(tableModeFor('night', false)).toBe('night');
        expect(tableModeFor('day', true)).toBe('day');
    });
});

describe('LampButton', () => {
    it('switches day and night, remembers it, and goes back to the phone on long press', async () => {
        await render(
            <TableThemeProvider>
                <Mode />
                <LampButton />
            </TableThemeProvider>,
        );
        expect(getDeviceSetting).toHaveBeenCalledWith('lamp');
        // Jest's colour scheme is light: auto = day.
        expect(screen.getByText('day light-palette')).toBeTruthy();
        expect(lamp()).toHaveProp('accessibilityLabel', 'Lamp off, follows the phone');

        await fireEvent.press(lamp());
        expect(screen.getByText('night night-palette')).toBeTruthy();
        expect(lamp()).toHaveProp('accessibilityLabel', 'Lamp on');
        expect(setDeviceSetting).toHaveBeenLastCalledWith('lamp', 'night');

        await fireEvent.press(lamp());
        expect(screen.getByText('day light-palette')).toBeTruthy();
        expect(setDeviceSetting).toHaveBeenLastCalledWith('lamp', 'day');

        await fireEvent(lamp(), 'longPress');
        expect(lamp()).toHaveProp('accessibilityLabel', 'Lamp off, follows the phone');
        expect(setDeviceSetting).toHaveBeenLastCalledWith('lamp', 'auto');
    });

    it('is fixed by the mode prop', async () => {
        await render(
            <TableThemeProvider mode="night">
                <Mode />
            </TableThemeProvider>,
        );
        expect(screen.getByText('night night-palette')).toBeTruthy();
    });
});

describe('Ashtray', () => {
    it('is on the table at night only, hidden from screen readers', async () => {
        const { rerender } = await render(
            <TableThemeProvider mode="day">
                <Ashtray size={60} />
            </TableThemeProvider>,
        );
        expect(screen.queryByTestId('ashtray', { includeHiddenElements: true })).toBeNull();
        await rerender(
            <TableThemeProvider mode="night">
                <Ashtray size={60} />
            </TableThemeProvider>,
        );
        expect(screen.getByTestId('ashtray', { includeHiddenElements: true })).toHaveProp('accessibilityElementsHidden', true);
    });
});

describe('TableLamp', () => {
    it('hangs at the top edge at night only, hidden from screen readers', async () => {
        const { rerender } = await render(
            <TableThemeProvider mode="day">
                <TableLamp insetTop={40} />
            </TableThemeProvider>,
        );
        expect(screen.queryByTestId('table-lamp', { includeHiddenElements: true })).toBeNull();
        await rerender(
            <TableThemeProvider mode="night">
                <TableLamp insetTop={40} />
            </TableThemeProvider>,
        );
        const lampView = screen.getByTestId('table-lamp', { includeHiddenElements: true });
        expect(lampView).toHaveProp('accessibilityElementsHidden', true);
        expect(lampView).toHaveProp('pointerEvents', 'none');
    });

    it('stays inside the status bar, and slim without one', () => {
        expect(lampDrop(47)).toBeLessThanOrEqual(26);
        expect(lampDrop(47)).toBeLessThan(47);
        expect(lampDrop(0)).toBeLessThanOrEqual(12);
    });
});

describe('Moth', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('comes now and then at night, then flies off', async () => {
        await render(
            <TableThemeProvider mode="night">
                <Moth insetTop={0} />
            </TableThemeProvider>,
        );
        expect(screen.queryByTestId('moth', { includeHiddenElements: true })).toBeNull();
        // The first one within 15 s.
        await act(async () => jest.advanceTimersByTime(15000));
        expect(screen.getByTestId('moth', { includeHiddenElements: true })).toBeTruthy();
        // Gone after at most ~10.6 s (circling 5–8 s, flying in and off).
        await act(async () => jest.advanceTimersByTime(11000));
        expect(screen.queryByTestId('moth', { includeHiddenElements: true })).toBeNull();
    });

    it('never comes by day', async () => {
        await render(
            <TableThemeProvider mode="day">
                <Moth insetTop={0} />
            </TableThemeProvider>,
        );
        await act(async () => jest.advanceTimersByTime(60000));
        expect(screen.queryByTestId('moth', { includeHiddenElements: true })).toBeNull();
    });
});

describe('card shadows', () => {
    it('fall further at night, away from the lamp', () => {
        expect(TABLE_THEMES.day.cardShadow).toBe('0px 1px 3px rgba(0, 0, 0, 0.3)');
        expect(TABLE_THEMES.night.cardShadow).not.toBe(TABLE_THEMES.day.cardShadow);
    });
});

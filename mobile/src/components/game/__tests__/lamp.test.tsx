import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { getDeviceSetting, setDeviceSetting } from '@/lib/deviceSettings';

import { Ashtray } from '../Ashtray';
import { LampButton } from '../LampButton';
import { tableModeFor, TableThemeProvider, useTableTheme } from '../tableTheme';

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

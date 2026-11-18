import { fireEvent, render, screen } from '@testing-library/react-native';

import { StopGameButton } from '../StopGameButton';
import { TableThemeProvider } from '../tableTheme';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@/lib/deviceSettings', () => ({
    getDeviceSetting: jest.fn(async () => null),
    setDeviceSetting: jest.fn(async () => {}),
}));

const show = async (onStop: () => void) =>
    render(
        <TableThemeProvider>
            <StopGameButton onStop={onStop} />
        </TableThemeProvider>,
    );

describe('StopGameButton', () => {
    it('asks first, then stops the game', async () => {
        const onStop = jest.fn();
        await show(onStop);
        await fireEvent.press(screen.getByRole('button', { name: 'Stop game' }));
        expect(onStop).not.toHaveBeenCalled();
        expect(screen.getByText('Stop the game?')).toBeTruthy();
        await fireEvent.press(screen.getByTestId('confirm-stop-game'));
        expect(onStop).toHaveBeenCalledTimes(1);
    });

    it('keeps playing when cancelled', async () => {
        const onStop = jest.fn();
        await show(onStop);
        await fireEvent.press(screen.getByRole('button', { name: 'Stop game' }));
        await fireEvent.press(screen.getByText('Keep playing'));
        expect(onStop).not.toHaveBeenCalled();
        expect(screen.queryByText('Stop the game?')).toBeNull();
    });
});

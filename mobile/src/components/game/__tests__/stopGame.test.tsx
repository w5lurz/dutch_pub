import { fireEvent, render, screen } from '@testing-library/react-native';

import { StopGameButton } from '../StopGameButton';
import { SwapPanel } from '../SwapPanel';
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

describe('SwapPanel', () => {
    it('offers Ready until you are ready, then shows who is', async () => {
        const onReady = jest.fn();
        const { rerender } = await render(<SwapPanel ready={false} readyCount={1} playerCount={3} onReady={onReady} />);
        expect(screen.getByText('1 / 3 ready')).toBeTruthy();
        await fireEvent.press(screen.getByTestId('swap-ready'));
        expect(onReady).toHaveBeenCalledTimes(1);
        await rerender(<SwapPanel ready readyCount={2} playerCount={3} onReady={onReady} />);
        expect(screen.queryByTestId('swap-ready')).toBeNull();
        expect(screen.getByText('2 / 3 ready')).toBeTruthy();
    });
});

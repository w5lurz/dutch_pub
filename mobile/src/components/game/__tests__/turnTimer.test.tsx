import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { DEFAULT_ROOM_SETTINGS } from '@dutch-pub/shared';

import { RoomSettingsFields } from '@/components/rooms/RoomSettingsFields';
import { TurnCountdown, useTurnSecondsLeft } from '../TurnCountdown';

describe('useTurnSecondsLeft', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('counts down from the ms left the server sent', async () => {
        const view = { turnTimeLeft: 15000 };
        const { result } = await renderHook(() => useTurnSecondsLeft(view));
        expect(result.current).toBe(15);
        await act(() => jest.advanceTimersByTime(1000));
        expect(result.current).toBe(14);
        await act(() => jest.advanceTimersByTime(13500));
        expect(result.current).toBe(1);
        await act(() => jest.advanceTimersByTime(1000));
        expect(result.current).toBe(0);
        await act(() => jest.advanceTimersByTime(5000));
        expect(result.current).toBe(0);
    });

    it('starts again with each new view, even with the same time left', async () => {
        const { result, rerender } = await renderHook(({ view }: { view: { turnTimeLeft: number } }) => useTurnSecondsLeft(view), {
            initialProps: { view: { turnTimeLeft: 30000 } },
        });
        await act(() => jest.advanceTimersByTime(10000));
        expect(result.current).toBe(20);
        await rerender({ view: { turnTimeLeft: 30000 } });
        expect(result.current).toBe(30);
    });

    it('is null while no turn is timed', async () => {
        const { result } = await renderHook(() => useTurnSecondsLeft({ turnTimeLeft: null }));
        expect(result.current).toBeNull();
        const { result: older } = await renderHook(() => useTurnSecondsLeft({}));
        expect(older.current).toBeNull();
    });
});

describe('TurnCountdown', () => {
    it('shows the seconds and reads them out', async () => {
        await render(<TurnCountdown seconds={12} mine />);
        expect(screen.getByText('12s')).toBeTruthy();
        expect(screen.getByLabelText('12 seconds left of your turn')).toBeTruthy();
    });

    it('turns red for the last seconds', async () => {
        const { rerender } = await render(<TurnCountdown seconds={6} />);
        expect(screen.getByTestId('turn-countdown')).not.toHaveStyle({ backgroundColor: '#dc2626' });
        await rerender(<TurnCountdown seconds={5} />);
        expect(screen.getByTestId('turn-countdown')).toHaveStyle({ backgroundColor: '#dc2626' });
    });
});

describe('turn timer room setting', () => {
    it('offers Off, 15s, 30s and 1m and reports the choice', async () => {
        const onChange = jest.fn();
        await render(<RoomSettingsFields value={{ ...DEFAULT_ROOM_SETTINGS }} onChange={onChange} />);
        await fireEvent.press(screen.getByTestId('house-rules-toggle'));
        expect(screen.getByText('Turn timer')).toBeTruthy();
        expect(screen.getByRole('radio', { name: '30s' })).toBeSelected();
        await fireEvent.press(screen.getByRole('radio', { name: '1m' }));
        expect(onChange).toHaveBeenCalledWith({ turnTimer: 60 });
        await fireEvent.press(screen.getByRole('radio', { name: 'Off' }));
        expect(onChange).toHaveBeenCalledWith({ turnTimer: 0 });
    });
});

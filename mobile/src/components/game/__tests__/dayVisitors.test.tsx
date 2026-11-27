import { act, render, screen } from '@testing-library/react-native';

import { DayVisitors, pickVisitor } from '../DayVisitors';
import { TableThemeProvider } from '../tableTheme';

jest.mock('@/lib/deviceSettings', () => ({
    getDeviceSetting: jest.fn(async () => null),
    setDeviceSetting: jest.fn(async () => {}),
}));

const visitor = () => screen.queryByTestId(/^day-visitor-/, { includeHiddenElements: true });

describe('pickVisitor', () => {
    it('sends a frisbee only rarely, otherwise a bee or a butterfly', () => {
        expect(pickVisitor(0.01)).toBe('frisbee');
        expect(pickVisitor(0.2)).toBe('bee');
        expect(pickVisitor(0.9)).toBe('butterfly');
        const kinds = Array.from({ length: 1000 }, (_, i) => pickVisitor(i / 1000));
        expect(kinds.filter(kind => kind === 'frisbee').length).toBeLessThan(100);
    });
});

describe('DayVisitors', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('comes now and then by day and flies across', async () => {
        // Fixed randomness: a butterfly arriving after 11.4 s, crossing in 9.7 s (a random bee or
        // frisbee arriving early could already be gone at the first check).
        jest.spyOn(Math, 'random').mockReturnValue(0.9);
        await render(
            <TableThemeProvider mode="day">
                <DayVisitors />
            </TableThemeProvider>,
        );
        expect(visitor()).toBeNull();
        // The first one within 12 s.
        await act(async () => jest.advanceTimersByTime(12000));
        expect(visitor()).toBeTruthy();
        // Across within 10 s at most (a butterfly is the slowest).
        await act(async () => jest.advanceTimersByTime(10000));
        expect(visitor()).toBeNull();
    });

    it('never comes at night', async () => {
        await render(
            <TableThemeProvider mode="night">
                <DayVisitors />
            </TableThemeProvider>,
        );
        await act(async () => jest.advanceTimersByTime(60000));
        expect(visitor()).toBeNull();
    });
});

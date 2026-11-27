import { act, render, screen } from '@testing-library/react-native';

import UpdateRequired from '@/components/UpdateRequired';
import { api } from '@/lib/api';
import { APP_VERSION, storeLinks } from '@/lib/appVersion';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(async () => null),
    setItemAsync: jest.fn(async () => {}),
    deleteItemAsync: jest.fn(async () => {}),
}));

const respond = (status: number, body: unknown) => Promise.resolve({ ok: status < 300, status, json: async () => body } as Response);

describe('minimum app version', () => {
    const fetchMock = jest.fn();
    beforeEach(() => {
        fetchMock.mockReset();
        globalThis.fetch = fetchMock;
    });

    it('sends the app version; a 426 covers the app with the update screen and its store button', async () => {
        await render(<UpdateRequired />);
        expect(screen.queryByTestId('update-required')).toBeNull();

        fetchMock.mockImplementation(() => respond(426, { message: 'Please update the app to keep playing.', code: 'UPDATE_REQUIRED' }));
        await act(async () => {
            await api.requestPasswordReset('a@b.hu', 'en');
        });

        expect(fetchMock.mock.calls[0][1].headers['X-App-Version']).toBe(APP_VERSION);
        expect(screen.getByText('Time for an update')).toBeTruthy();
        expect(screen.getByText(`v${APP_VERSION}`)).toBeTruthy();
        // Tests run as iOS: no App Store page yet (EXPO_PUBLIC_IOS_STORE_URL), so no button.
        expect(screen.queryByTestId('update-button')).toBeNull();
    });

    it('sends Android to the Play Store app (its web page as a fallback), iOS only to a known App Store page', () => {
        expect(storeLinks('android', 'hu.dutchpub.app')).toEqual([
            'market://details?id=hu.dutchpub.app',
            'https://play.google.com/store/apps/details?id=hu.dutchpub.app',
        ]);
        expect(storeLinks('ios', 'hu.dutchpub.app')).toEqual([]);
        expect(storeLinks('ios', 'hu.dutchpub.app', 'https://apps.apple.com/app/id1')).toEqual(['https://apps.apple.com/app/id1']);
    });
});

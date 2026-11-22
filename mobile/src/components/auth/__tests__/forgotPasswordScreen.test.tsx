import { fireEvent, render, screen } from '@testing-library/react-native';

import ForgotPasswordScreen from '@/app/forgot-password';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
// Not inside a navigator here: no header to measure.
jest.mock('expo-router/react-navigation', () => ({ useHeaderHeight: () => 0 }));
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(async () => null),
    setItemAsync: jest.fn(async () => {}),
    deleteItemAsync: jest.fn(async () => {}),
}));

const respond = (status: number, body: unknown) => Promise.resolve({ ok: status < 300, status, json: async () => body } as Response);

describe('ForgotPasswordScreen', () => {
    const fetchMock = jest.fn();
    beforeEach(() => {
        fetchMock.mockReset();
        globalThis.fetch = fetchMock;
    });

    it('asks the server for the link and shows its answer', async () => {
        fetchMock.mockImplementation(() => respond(200, { message: 'If an account uses this email, a link is on its way.' }));
        await render(<ForgotPasswordScreen />);
        await fireEvent.changeText(screen.getByLabelText('Your email'), ' tamas@example.hu ');
        await fireEvent.press(screen.getByText('Send the link'));
        expect(await screen.findByText('If an account uses this email, a link is on its way.')).toBeTruthy();
        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toMatch(/\/api\/auth\/forgot-password$/);
        expect(JSON.parse(init.body)).toEqual({ email: 'tamas@example.hu', language: 'en' });
    });

    it("doesn't send an invalid email; shows the server's refusal", async () => {
        await render(<ForgotPasswordScreen />);
        await fireEvent.changeText(screen.getByLabelText('Your email'), 'nope');
        await fireEvent.press(screen.getByText('Send the link'));
        expect(fetchMock).not.toHaveBeenCalled();
        expect(screen.getByText('Please give a valid email address.')).toBeTruthy();

        fetchMock.mockImplementation(() => respond(503, { message: 'Password reset is not set up on this server yet.' }));
        await fireEvent.changeText(screen.getByLabelText('Your email'), 'a@b.hu');
        await fireEvent.press(screen.getByText('Send the link'));
        expect(await screen.findByText('Password reset is not set up on this server yet.')).toBeTruthy();
    });
});

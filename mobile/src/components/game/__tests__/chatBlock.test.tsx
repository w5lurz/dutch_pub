import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { blockPlayer, isBlocked, unblockPlayer } from '@/lib/blockedPlayers';

import { ChatModal } from '../ChatModal';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@/lib/deviceSettings', () => ({ getDeviceSetting: jest.fn(async () => null), setDeviceSetting: jest.fn(async () => {}) }));

const messages = [
    { id: 1, senderName: 'Julcsi', message: 'hi', time: '10:00' },
    { id: 2, senderName: 'me', message: 'hello', time: '10:01' },
];

describe('blocking a player in the chat', () => {
    afterEach(() => act(() => unblockPlayer('Julcsi')));

    it("blocks someone else from their message, lists them, and unblocks them", async () => {
        await render(<ChatModal visible onClose={jest.fn()} messages={messages} username="me" onSend={() => true} canSend />);
        // Your own message offers nothing.
        expect(screen.getByLabelText('me at 10:01: hello').props.accessibilityState?.disabled).toBe(true);

        await fireEvent.press(screen.getByLabelText('Julcsi at 10:00: hi'));
        expect(screen.getByText('Block Julcsi?')).toBeTruthy();
        await fireEvent.press(screen.getByText('Block'));
        expect(isBlocked('Julcsi')).toBe(true);

        await fireEvent.press(screen.getByText('Blocked (1)'));
        await fireEvent.press(screen.getByLabelText('Unblock Julcsi'));
        expect(isBlocked('Julcsi')).toBe(false);
        expect(screen.queryByText('Blocked (1)')).toBeNull();
    });

    it('cancelling keeps them', async () => {
        await render(<ChatModal visible onClose={jest.fn()} messages={messages} username="me" onSend={() => true} canSend />);
        await fireEvent.press(screen.getByLabelText('Julcsi at 10:00: hi'));
        await fireEvent.press(screen.getByText('Cancel'));
        expect(isBlocked('Julcsi')).toBe(false);
    });

    it('blocking twice keeps one entry', () => {
        act(() => {
            blockPlayer('Julcsi');
            blockPlayer('Julcsi');
        });
        expect(isBlocked('Julcsi')).toBe(true);
        act(() => unblockPlayer('Julcsi'));
        expect(isBlocked('Julcsi')).toBe(false);
    });
});

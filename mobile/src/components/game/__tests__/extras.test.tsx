import { render, screen } from '@testing-library/react-native';
import { createAudioPlayer } from 'expo-audio';
import type { Game, TCard } from '@dutch-pub/shared';

import { playSound, setSoundsOn } from '@/lib/sounds';
import { cigaretteLook } from '../Ashtray';
import { ChatModal } from '../ChatModal';
import { soundFor } from '../gameSounds';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@/lib/deviceSettings', () => ({
    getDeviceSetting: jest.fn(async () => null),
    setDeviceSetting: jest.fn(async () => {}),
}));

const card = (value: number): TCard => ({ name: String(value), value, color: 'hearts' });
const view = (laid: number, burnt = 0, extra: Partial<Game> = {}): Game => ({
    userCards: { hand: [], table: 0, tableFlipped: [] },
    opponents: {},
    deck: 0,
    laidCards: laid ? Array.from({ length: laid }, () => card(5)) : null,
    burntCards: burnt ? Array.from({ length: burnt }, () => card(5)) : null,
    ...extra,
});

describe('soundFor', () => {
    it('a card laid, an Ace call, a burn, a pick-up', () => {
        expect(soundFor(view(1), view(2))).toBe('lay');
        expect(soundFor(view(1), view(2, 0, { call: { by: 'a', target: 'b' } }))).toBe('call');
        expect(soundFor(view(3), view(0, 4))).toBe('burn');
        expect(soundFor(view(3), view(0))).toBe('pickup');
        expect(soundFor(view(2), view(2))).toBeNull();
    });
});

describe('sounds', () => {
    it('play unless turned off', () => {
        const players = jest.mocked(createAudioPlayer);
        setSoundsOn(true);
        playSound('lay');
        const player = players.mock.results.at(-1)?.value;
        expect(player.play).toHaveBeenCalledTimes(1);
        setSoundsOn(false);
        playSound('lay');
        expect(player.play).toHaveBeenCalledTimes(1);
        setSoundsOn(true);
    });
});

describe('cigaretteLook', () => {
    it('is the same for the same room on every device, and differs between rooms', () => {
        expect(cigaretteLook(7)).toEqual(cigaretteLook(7));
        const looks = new Set(Array.from({ length: 40 }, (_, seed) => JSON.stringify(cigaretteLook(seed))));
        expect(looks.size).toBeGreaterThan(5);
        const kinds = new Set(Array.from({ length: 40 }, (_, seed) => cigaretteLook(seed).lit.kind));
        expect(kinds).toEqual(new Set(['factory', 'rolled']));
    });
});

describe('ChatModal', () => {
    it("shows the sender's avatar by each message", async () => {
        const messages = [
            { id: 1, senderName: 'Julcsi', message: 'hi', time: '10:00' },
            { id: 2, senderName: 'me', message: 'hello', time: '10:01' },
        ];
        await render(
            <ChatModal visible onClose={jest.fn()} messages={messages} username="me" onSend={() => true} canSend avatars={{ Julcsi: 'owl' }} />,
        );
        expect(screen.getByLabelText('Julcsi at 10:00: hi')).toBeTruthy();
        expect(screen.getByLabelText('me at 10:01: hello')).toBeTruthy();
    });
});

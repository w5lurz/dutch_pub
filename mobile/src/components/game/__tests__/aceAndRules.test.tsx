import { fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DEFAULT_ROOM_SETTINGS, type TCard } from '@dutch-pub/shared';

import { RoomSettingsFields, describeRoomSettings } from '@/components/rooms/RoomSettingsFields';
import { needsAceCall } from '../aceCall';
import { AceCallSheet } from '../AceCallSheet';
import { CardDragProvider } from '../CardDrag';
import { PileArea } from '../PileArea';
import { TableThemeProvider } from '../tableTheme';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@/lib/deviceSettings', () => ({
    getDeviceSetting: jest.fn(async () => null),
    setDeviceSetting: jest.fn(async () => {}),
}));

const card = (value: number, extra: Partial<TCard> = {}): TCard => ({ name: String(value), value, color: 'hearts', ...extra });
const ace = card(14, { name: 'Call Next', isMagicCard: true });

describe('needsAceCall', () => {
    const situation = { touchable: true, active: true, swapPhase: false, others: 2, laidCards: [card(5)] };

    it('an Ace that may be laid, with 2+ others: pick who is called first', () => {
        expect(needsAceCall(ace, situation)).toBe(true);
        expect(needsAceCall([ace, { ...ace, color: 'clubs' }], situation)).toBe(true);
    });

    it('not with one other player, other cards, a blind card, or when the Ace may not be laid', () => {
        expect(needsAceCall(ace, { ...situation, others: 1 })).toBe(false);
        expect(needsAceCall(card(13), situation)).toBe(false);
        expect(needsAceCall(0, situation)).toBe(false);
        expect(needsAceCall(ace, { ...situation, active: false })).toBe(false);
        expect(needsAceCall(ace, { ...situation, touchable: false })).toBe(false);
        expect(needsAceCall(ace, { ...situation, swapPhase: true })).toBe(false);
        expect(needsAceCall(ace, { ...situation, laidCards: [card(9, { name: 'You lose', isTeaseCard: true })] })).toBe(false);
    });
});

describe('AceCallSheet', () => {
    it('calls the chosen player, or keeps the Ace', async () => {
        const onCall = jest.fn();
        const onCancel = jest.fn();
        await render(<AceCallSheet visible players={['Julcsi', 'Lacika']} onCall={onCall} onCancel={onCancel} />);
        expect(screen.getByText('Call a player')).toBeTruthy();
        await fireEvent.press(screen.getByRole('button', { name: 'Call Lacika' }));
        expect(onCall).toHaveBeenCalledWith('Lacika');
        await fireEvent.press(screen.getAllByRole('button', { name: 'Keep the Ace' })[0]);
        expect(onCancel).toHaveBeenCalled();
    });
});

describe('PileArea messages', () => {
    const piles = (props: Partial<Parameters<typeof PileArea>[0]>) =>
        render(
            <GestureHandlerRootView>
                <TableThemeProvider>
                    <CardDragProvider>
                        <PileArea deck={10} laidCards={[ace]} burntCards={null} turnOf="Lacika" username="me" {...props} />
                    </CardDragProvider>
                </TableThemeProvider>
            </GestureHandlerRootView>,
        );

    it("says who was called while it is the called player's turn", async () => {
        await piles({ call: { by: 'Julcsi', target: 'Lacika' } });
        expect(screen.getByText('Julcsi called Lacika: a magic card or pick up!')).toBeTruthy();
    });

    it('speaks to you when you are called, or called someone', async () => {
        await piles({ turnOf: null, call: { by: 'Julcsi', target: 'me' } });
        expect(screen.getByText('Julcsi called you: a magic card or pick up!')).toBeTruthy();
        await piles({ call: { by: 'me', target: 'Lacika' } });
        expect(screen.getByText('You called Lacika: a magic card or pick up!')).toBeTruthy();
    });

    it('shows when the turn order is reversed', async () => {
        await piles({ reversed: true });
        expect(screen.getByLabelText('Turn order reversed')).toBeTruthy();
        expect(screen.getByText("Lacika's turn")).toBeTruthy();
    });
});

describe('house rule settings', () => {
    it('offer 9 on a magic card, 6 reverses and the decks', async () => {
        const onChange = jest.fn();
        await render(<RoomSettingsFields value={{ ...DEFAULT_ROOM_SETTINGS }} onChange={onChange} />);
        await fireEvent(screen.getByRole('switch', { name: '6 reverses' }), 'valueChange', true);
        expect(onChange).toHaveBeenCalledWith({ sixReverses: true });
        await fireEvent(screen.getByRole('switch', { name: '9 on a magic card' }), 'valueChange', false);
        expect(onChange).toHaveBeenCalledWith({ nineOnMagic: false });
        expect(screen.getByRole('radio', { name: 'Auto' })).toBeSelected();
        await fireEvent.press(screen.getByRole('radio', { name: '2' }));
        expect(onChange).toHaveBeenCalledWith({ decks: 2 });
    });

    it('the room card lists the house rules that differ from the base game', () => {
        expect(describeRoomSettings({ ...DEFAULT_ROOM_SETTINGS })).toBe('Card powers shown · Red backs · 30s turns');
        expect(describeRoomSettings({ ...DEFAULT_ROOM_SETTINGS, nineOnMagic: false, sixReverses: true, decks: 1 })).toBe(
            'Card powers shown · Red backs · 30s turns · No 9 on magic · 6 reverses · 1 deck',
        );
    });
});

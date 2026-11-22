import { fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { generatedAvatarId, type Opponent, type TCard, type UserCards } from '@dutch-pub/shared';

import { CardDragProvider } from '../CardDrag';
import { HandFan } from '../HandFan';
import { PlayerBoard } from '../PlayerBoard';
import { PlayingCard } from '../PlayingCard';
import { Seat } from '../Seat';

const card = (value: number, color = 'hearts', name = String(value)): TCard => ({ name, value, color });

/** Fires a screen-reader action ("activate" = tap, "play") on an element. */
const action = (element: ReturnType<typeof screen.getByRole>, actionName: string) =>
    fireEvent(element, 'accessibilityAction', { nativeEvent: { actionName } });

/** Your cards are buttons; the card image inside carries the same label. */
const button = (name: string) => screen.getByRole('button', { name });

describe('PlayingCard', () => {
    it('labels a face-up card with its name, value and suit', async () => {
        await render(<PlayingCard card={card(13, 'diamonds', 'K')} />);
        // The face is drawn (French-suited art, hidden from screen readers): the label carries it.
        expect(screen.getByLabelText('K (13) of diamonds')).toBeTruthy();
        expect(screen.queryByText('13')).toBeNull();
    });

    it('labels a face-down card, with the hidden count', async () => {
        await render(<PlayingCard faceDown plusCount={2} />);
        expect(screen.getByLabelText('Face-down card, 2 more below')).toBeTruthy();
        expect(screen.getByText('+2')).toBeTruthy();
    });
});

describe('HandFan', () => {
    it('draws one back per card, without a count, while they fit', async () => {
        await render(<HandFan count={7} />);
        expect(screen.getByLabelText('7 cards in hand')).toBeTruthy();
        expect(screen.getAllByLabelText('Face-down card')).toHaveLength(7);
        expect(screen.queryByText('×7')).toBeNull();
    });

    it('compresses and shows the count when there are too many cards', async () => {
        await render(<HandFan count={12} fit={8} />);
        expect(screen.getByLabelText('12 cards in hand')).toBeTruthy();
        expect(screen.getByText('×12')).toBeTruthy();
        expect(screen.getAllByLabelText('Face-down card')).toHaveLength(12);
    });

    it('keeps the count upright when the fan is turned', async () => {
        await render(<HandFan count={30} fit={8} rotate={90} />);
        // At most 20 backs are drawn; the count says the rest.
        expect(screen.getAllByLabelText('Face-down card')).toHaveLength(20);
        expect(screen.getByText('×30')).toBeTruthy();
    });

    it('says so when the hand is empty', async () => {
        await render(<HandFan count={0} />);
        expect(screen.getByText('No cards')).toBeTruthy();
        expect(screen.getByLabelText('0 cards in hand')).toBeTruthy();
    });
});

describe('Seat', () => {
    const anna: Opponent = { hand: 4, table: 3, tableFlipped: [card(5), card(9)], active: true };
    const bela: Opponent = { hand: 0, table: 0, tableFlipped: [], active: false };

    it('shows the name with counts and turn, the hand and the stacks', async () => {
        await render(<Seat name="anna" opponent={anna} position="top" layout="portrait" />);
        expect(screen.getByLabelText('anna, on turn: 4 in hand, 2 face-up, 3 face-down')).toBeTruthy();
        expect(screen.getByTestId(`avatar-${generatedAvatarId('anna')}`)).toBeTruthy(); // generated from the name
        expect(screen.getByLabelText('4 cards in hand')).toBeTruthy();
        expect(screen.getByLabelText('5 of hearts')).toBeTruthy();
        expect(screen.getByLabelText('9 of hearts')).toBeTruthy();
        // 4 backs in the hand + the face-down card under the third spot (none on top of it)
        // and the two under the face-up cards.
        expect(screen.getAllByLabelText('Face-down card')).toHaveLength(7);
    });

    it('glows red for a player close to winning: a halo, and a fast orange-red glow on turn', async () => {
        const close: Opponent = { hand: 2, table: 0, tableFlipped: [card(5)], active: false };
        await render(<Seat name="cili" opponent={close} position="top" layout="portrait" />);
        expect(screen.getByTestId('danger-halo')).toBeTruthy();
        expect(screen.queryByTestId('turn-glow')).toBeNull();
        expect(screen.getByLabelText('cili, close to winning: 2 in hand, 1 face-up, 0 face-down')).toBeTruthy();

        await render(<Seat name="cili" opponent={{ ...close, active: true }} position="top" layout="portrait" />);
        expect(screen.getByTestId('danger-turn-glow')).toBeTruthy();
        expect(screen.queryByTestId('danger-halo')).toBeNull();
    });

    it('no danger glow with more cards left', async () => {
        await render(<Seat name="anna" opponent={anna} position="top" layout="portrait" />);
        expect(screen.getByTestId('turn-glow')).toBeTruthy();
        expect(screen.queryByTestId('danger-halo')).toBeNull();
    });

    it('shows a player without cards', async () => {
        await render(<Seat name="bela" opponent={bela} position="left" layout="portrait" />);
        expect(screen.getByLabelText('bela: 0 in hand, 0 face-up, 0 face-down')).toBeTruthy();
        expect(screen.getByText('No cards')).toBeTruthy();
        expect(screen.queryAllByLabelText('Face-down card')).toHaveLength(0);
    });

    it('turns a side seat\x27s cards toward the centre', async () => {
        await render(<Seat name="anna" opponent={anna} position="right" layout="wide" />);
        const turned = JSON.stringify(screen.toJSON()).split('"rotate":"-90deg"').length - 1;
        // The hand fan and the stacks.
        expect(turned).toBe(2);
    });

    it('shows the chosen avatar', async () => {
        await render(<Seat name="anna" opponent={anna} position="top" layout="wide" avatarId="penguin" />);
        expect(screen.getByTestId('avatar-penguin')).toBeTruthy();
    });

    it('shows a given picture instead of the avatar', async () => {
        await render(<Seat name="anna" opponent={anna} position="top" layout="wide" avatar={<PlayingCard faceDown accessibilityLabel="avatar" />} />);
        expect(screen.getByLabelText('avatar')).toBeTruthy();
        expect(screen.queryByTestId(/^avatar-/)).toBeNull();
    });
});

describe('PlayerBoard', () => {
    const renderBoard = async (userCards: UserCards, { laidCards = null as TCard[] | null, active = true } = {}) => {
        const onLayCard = jest.fn(() => true);
        await render(
            <GestureHandlerRootView>
                <CardDragProvider>
                    <PlayerBoard userCards={userCards} laidCards={laidCards} active={active} username="me" onLayCard={onLayCard} />
                </CardDragProvider>
            </GestureHandlerRootView>,
        );
        return onLayCard;
    };

    it('plays a hand card with its index', async () => {
        const hand = [card(3), card(8, 'spades')];
        const onLayCard = await renderBoard({ hand, tableFlipped: [card(9)], table: 3 });
        await action(button('8 of spades'), 'play');
        expect(onLayCard).toHaveBeenCalledWith(hand[1], 1, true);
    });

    it('selects a card on tap (activate) and deselects it on a second tap', async () => {
        await renderBoard({ hand: [card(3), card(8)], tableFlipped: [], table: 0 });
        const three = button('3 of hearts');
        await action(three, 'activate');
        expect(button('3 of hearts')).toHaveProp('accessibilityState', { selected: true });
        expect(button('8 of hearts')).toHaveProp('accessibilityState', { selected: false });
        await action(button('3 of hearts'), 'activate');
        expect(button('3 of hearts')).toHaveProp('accessibilityState', { selected: false });
    });

    it('marks face-up cards as not playable while the hand has cards', async () => {
        const onLayCard = await renderBoard({ hand: [card(3)], tableFlipped: [card(9, 'clubs')], table: 3 });
        await action(button('9 of clubs'), 'play');
        expect(onLayCard).toHaveBeenCalledWith(card(9, 'clubs'), 0, false);
    });

    it('plays face-up cards once the hand is empty', async () => {
        const onLayCard = await renderBoard({ hand: [], tableFlipped: [card(9, 'clubs')], table: 3 });
        await action(button('9 of clubs'), 'play');
        expect(onLayCard).toHaveBeenCalledWith(card(9, 'clubs'), 0, true);
    });

    it('only exposes face-down cards that nothing lies on, and plays them by index', async () => {
        const onLayCard = await renderBoard({ hand: [], tableFlipped: [card(9)], table: 3 });
        // Spot 0 has the 9 on top: its face-down card is not a button.
        expect(screen.getAllByRole('button', { name: 'Face-down card' })).toHaveLength(2);
        await action(screen.getAllByRole('button', { name: 'Face-down card' })[1], 'play');
        expect(onLayCard).toHaveBeenCalledWith(2, 2, false);
    });

    it('lets face-down cards be played once all other cards are gone', async () => {
        const onLayCard = await renderBoard({ hand: [], tableFlipped: [], table: 2 });
        await action(screen.getAllByRole('button', { name: 'Face-down card' })[0], 'play');
        expect(onLayCard).toHaveBeenCalledWith(0, 0, true);
    });

    it('keeps the cards on the spots the server sends; a face-down card is played by its place among those left', async () => {
        // Spot 0 is empty (both played), the 9 lies on spot 1, spot 2 has only its face-down card.
        const onLayCard = await renderBoard({
            hand: [],
            tableFlipped: [card(9, 'clubs')],
            table: 2,
            spots: [
                { faceUp: null, faceDown: false },
                { faceUp: card(9, 'clubs'), faceDown: true },
                { faceUp: null, faceDown: true },
            ],
        });
        await action(button('9 of clubs'), 'play');
        expect(onLayCard).toHaveBeenLastCalledWith(card(9, 'clubs'), 1, true);
        // Only spot 2's face-down card is free: the second face-down card left (index 1), at spot 2.
        const free = screen.getAllByRole('button', { name: 'Face-down card' });
        expect(free).toHaveLength(1);
        await action(free[0], 'play');
        expect(onLayCard).toHaveBeenLastCalledWith(1, 2, false);
    });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Opponents, TCard, UserCards } from '@dutch-pub/shared';

import { CardDragProvider } from '../CardDrag';
import { HandFan } from '../HandFan';
import { OpponentsBar } from '../OpponentsBar';
import { PlayerBoard } from '../PlayerBoard';
import { PlayingCard } from '../PlayingCard';

const card = (value: number, color = 'hearts', name = String(value)): TCard => ({ name, value, color });

/** Fires a screen-reader action ("activate" = tap, "play") on an element. */
const action = (element: ReturnType<typeof screen.getByRole>, actionName: string) =>
    fireEvent(element, 'accessibilityAction', { nativeEvent: { actionName } });

/** Your cards are buttons; the card image inside carries the same label. */
const button = (name: string) => screen.getByRole('button', { name });

describe('PlayingCard', () => {
    it('labels a face-up card with its name, value and suit', async () => {
        await render(<PlayingCard card={card(13, 'diamonds', 'K')} />);
        expect(screen.getByLabelText('K (13) of diamonds')).toBeTruthy();
        expect(screen.getByText('13')).toBeTruthy();
        expect(screen.getByText('K')).toBeTruthy();
    });

    it('labels a face-down card, with the hidden count', async () => {
        await render(<PlayingCard faceDown plusCount={2} />);
        expect(screen.getByLabelText('Face-down card, 2 more below')).toBeTruthy();
        expect(screen.getByText('+2')).toBeTruthy();
    });
});

describe('HandFan', () => {
    it('shows at most 5 card backs and the full count', async () => {
        await render(<HandFan count={7} />);
        expect(screen.getByLabelText('7 cards in hand')).toBeTruthy();
        expect(screen.getByText('×7')).toBeTruthy();
        expect(screen.getAllByLabelText('Face-down card')).toHaveLength(5);
    });

    it('says so when the hand is empty', async () => {
        await render(<HandFan count={0} />);
        expect(screen.getByText('No cards in hand')).toBeTruthy();
    });
});

describe('OpponentsBar', () => {
    const opponents: Opponents = {
        anna: { hand: 4, table: 3, tableFlipped: [card(5), card(9)], active: true },
        bela: { hand: 0, table: 0, tableFlipped: [], active: false },
    };

    it('shows every opponent with their counts and turn', async () => {
        await render(<OpponentsBar opponents={opponents} />);
        expect(screen.getByLabelText('anna, on turn: 4 in hand, 2 face-up, 3 face-down')).toBeTruthy();
        expect(screen.getByLabelText('bela: 0 in hand, 0 face-up, 0 face-down')).toBeTruthy();
        expect(screen.getByLabelText('5 of hearts')).toBeTruthy();
        expect(screen.getByText('No table cards')).toBeTruthy();
    });

    it('renders nothing without opponents', async () => {
        await render(<OpponentsBar opponents={{}} />);
        expect(screen.queryByLabelText(/Opponents/)).toBeNull();
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
});

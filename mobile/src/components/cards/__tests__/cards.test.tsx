import { render, screen } from '@testing-library/react-native';
import { CARD_SUITS, type CardRank, type TCard } from '@dutch-pub/shared';

import { CardBackArt, CardFaceArt, CardStamp, shortStampText, stampText } from '..';

const RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
/** The stamp is hidden from screen readers, so default queries skip it. */
const HIDDEN = { includeHiddenElements: true };
const clearAll: TCard = { name: 'Clear all', value: 10, color: 'hearts', isMagicCard: true };

describe('CardFaceArt', () => {
    it('renders every card, full and compact', async () => {
        for (const suit of CARD_SUITS) {
            for (const rank of RANKS) {
                for (const variant of ['full', 'compact'] as const) {
                    await render(<CardFaceArt rank={rank} suit={suit} width={60} height={84} variant={variant} />);
                }
            }
        }
    });

    it('is hidden from screen readers unless labelled', async () => {
        await render(<CardFaceArt rank="K" suit="spades" width={60} height={84} />);
        expect(screen.queryByRole('image')).toBeNull();

        await render(<CardFaceArt rank="K" suit="spades" width={60} height={84} accessibilityLabel="King of spades" />);
        expect(screen.getByLabelText('King of spades')).toBeTruthy();
    });

    it('stamps special cards unless told not to', async () => {
        await render(<CardFaceArt card={clearAll} width={70} height={98} />);
        expect(screen.getByTestId('card-stamp', HIDDEN)).toBeTruthy();
        expect(screen.getByText('CLEAR ALL', HIDDEN)).toBeTruthy();

        await render(<CardFaceArt card={clearAll} width={70} height={98} showStamp={false} />);
        expect(screen.queryByTestId('card-stamp', HIDDEN)).toBeNull();

        await render(<CardFaceArt card={{ name: '7', value: 7, color: 'clubs' }} width={70} height={98} />);
        expect(screen.queryByTestId('card-stamp', HIDDEN)).toBeNull();
    });
});

describe('CardStamp', () => {
    it('uses the short form on small cards and nothing on the smallest', async () => {
        await render(<CardStamp text="START OVER" cardWidth={45} cardHeight={63} />);
        expect(screen.getByText('RESET', HIDDEN)).toBeTruthy();

        await render(<CardStamp text="START OVER" cardWidth={30} cardHeight={42} />);
        expect(screen.queryByTestId('card-stamp', HIDDEN)).toBeNull();
    });

    it('can be hidden', async () => {
        await render(<CardStamp text="MIRROR" cardWidth={80} cardHeight={112} hidden />);
        expect(screen.queryByTestId('card-stamp', HIDDEN)).toBeNull();
    });

    it('derives the text from special cards only', () => {
        expect(stampText(clearAll)).toBe('CLEAR ALL');
        expect(stampText({ name: '9', isTeaseCard: false })).toBeNull();
        expect(shortStampText('YOU LOSE')).toBe('LOSE');
        expect(shortStampText('CALL NEXT')).toBe('CALL');
    });
});

describe('CardBackArt', () => {
    it('renders red and blue backs, hidden from screen readers by default', async () => {
        await render(<CardBackArt width={60} height={84} />);
        await render(<CardBackArt width={60} height={84} color="blue" />);
        expect(screen.queryByRole('image')).toBeNull();

        await render(<CardBackArt width={60} height={84} accessibilityLabel="Face-down card" />);
        expect(screen.getByLabelText('Face-down card')).toBeTruthy();
    });
});

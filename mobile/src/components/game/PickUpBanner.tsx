import type { PickedUp } from '@dutch-pub/shared';

import i18n from '@/i18n';

import { NameLine, TableBanner } from './TableBanner';

type PickUpBannerProps = {
    pickedUp: PickedUp;
    /** Your username: your own pick-up says "You". */
    username?: string;
};

/**
 * Shown to everyone during the pause after a pick-up (`game.pickedUp`, a few seconds): who picked
 * up the pile and how many cards, big over the upper part of the table. Big pick-ups get the
 * librarian instead (`Librarian`).
 */
export function PickUpBanner({ pickedUp, username }: PickUpBannerProps) {
    const you = pickedUp.username === username;
    const cards = i18n.t('game.pickUp.cards', { count: pickedUp.count });
    const plain = you ? i18n.t('game.pickUp.you') : i18n.t('game.pickUp.title', { name: pickedUp.username }).replace(/<\/?n>/g, '');
    return (
        <TableBanner
            title={you ? plain : <NameLine i18nKey="game.pickUp.title" name={pickedUp.username} />}
            subtitle={cards}
            label={`${plain} ${cards}`}
        />
    );
}

export default PickUpBanner;

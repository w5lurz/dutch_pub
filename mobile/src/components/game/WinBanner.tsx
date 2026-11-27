import i18n from '@/i18n';

import { NameLine, TableBanner } from './TableBanner';

type WinBannerProps = {
    winner: string;
    /** Your username: your own win says "You". */
    username?: string;
};

/** Who won, big in the middle of the table for everyone, until the game closes. */
export function WinBanner({ winner, username }: WinBannerProps) {
    const you = winner === username;
    const congrats = i18n.t('game.win.congrats');
    const plain = you ? i18n.t('game.win.you') : i18n.t('game.win.title', { name: winner }).replace(/<\/?n>/g, '');
    return (
        <TableBanner
            title={you ? `🏆 ${plain}` : <NameLine i18nKey="game.win.title" name={winner} />}
            subtitle={congrats}
            label={`${plain} ${congrats}`}
            at={0.36}
        />
    );
}

export default WinBanner;

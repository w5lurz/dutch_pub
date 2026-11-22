import { Text, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Bullet, BulletList, Paragraph, SectionHeading, Strong, SubHeading } from './Typography';

// Copy ported from the former web app (frontend/src/components/Welcome/Welcome.tsx, removed; see git history), obvious typos fixed.
// Texts: `home.*` in src/i18n/locales; <b>...</b> in them is shown bold.

const bold = { b: <Strong /> };

export function AboutSection() {
    const { t } = useTranslation();
    return (
        <View>
            <SectionHeading className="mt-2">{t('home.about.title')}</SectionHeading>
            <Paragraph>{t('home.about.text')}</Paragraph>
        </View>
    );
}

export function HowTheGameWorksSection() {
    const { t } = useTranslation();
    return (
        <View>
            <SectionHeading>{t('home.how.title')}</SectionHeading>
            <Paragraph>{t('home.how.intro')}</Paragraph>

            <SubHeading>{t('home.how.startTitle')}</SubHeading>
            <Paragraph>{t('home.how.start')}</Paragraph>
            <BulletList>
                <Bullet>
                    <Trans i18nKey="home.how.hand" components={bold} />
                </Bullet>
                <Bullet>
                    <Trans i18nKey="home.how.flipped" components={bold} />
                </Bullet>
                <Bullet>
                    <Trans i18nKey="home.how.table" components={bold} />
                </Bullet>
            </BulletList>

            <SubHeading>{t('home.how.layingTitle')}</SubHeading>
            <Paragraph>{t('home.how.laying')}</Paragraph>

            <SubHeading>{t('home.how.rulesTitle')}</SubHeading>
            <BulletList>
                <Bullet>{t('home.how.ruleMustPlace')}</Bullet>
                <Bullet>{t('home.how.ruleFourBurn')}</Bullet>
                <Bullet>{t('home.how.rulePickUp')}</Bullet>
                <Bullet>
                    <Trans i18nKey="home.how.ruleFlipped" components={bold} />
                </Bullet>
                <Bullet>
                    <Trans i18nKey="home.how.ruleTable" components={bold} />
                </Bullet>
                <Bullet>{t('home.how.ruleWin')}</Bullet>
            </BulletList>
        </View>
    );
}

const simpleCards: readonly { label: string; max: number }[] = [
    { label: '3', max: 3 },
    { label: '4', max: 4 },
    { label: '5', max: 5 },
    { label: '6', max: 6 },
    { label: '7', max: 7 },
    { label: 'J (11)', max: 11 },
    { label: 'Q (12)', max: 12 },
    { label: 'K (13)', max: 13 },
];

export function CardsSection() {
    const { t } = useTranslation();
    return (
        <View>
            <SectionHeading>{t('home.cards.title')}</SectionHeading>
            <Paragraph>{t('home.cards.intro')}</Paragraph>

            <SubHeading>{t('home.cards.magicTitle')}</SubHeading>
            <BulletList>
                <Bullet>
                    <Trans i18nKey="home.cards.startOver" components={bold} />
                </Bullet>
                <Bullet>
                    <Trans i18nKey="home.cards.mirror" components={bold} />
                </Bullet>
                <Bullet>
                    <Trans i18nKey="home.cards.clearAll" components={bold} />
                </Bullet>
                <Bullet>
                    <Trans i18nKey="home.cards.callNext" components={bold} />
                </Bullet>
            </BulletList>

            <SubHeading>{t('home.cards.teaseTitle')}</SubHeading>
            <BulletList>
                <Bullet>
                    <Trans i18nKey="home.cards.youLose" components={bold} />
                </Bullet>
            </BulletList>

            <SubHeading>{t('home.cards.simpleTitle')}</SubHeading>
            <BulletList>
                {simpleCards.map(card => (
                    <Bullet key={card.label}>
                        <Strong>{card.label}</Strong>
                        <Text>{t('home.cards.simple', { max: card.max })}</Text>
                    </Bullet>
                ))}
            </BulletList>
        </View>
    );
}

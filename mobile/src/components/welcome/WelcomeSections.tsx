import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import type { TCard } from '@dutch-pub/shared';

import { CardFaceArt } from '@/components/cards';
import { Bullet, BulletList, Paragraph, SectionHeading, Strong, SubHeading } from './Typography';

// Home tab texts: `home.*` in src/i18n/locales; <b>...</b> in them is shown bold.

const bold = { b: <Strong /> };

/** The small card pictures next to the special cards (any suit; the art draws the rank). */
const CARD_PICTURE = { width: 40, height: 58 };
const START_OVER: TCard = { name: 'Start Over', value: 2, color: 'hearts', isMagicCard: true };
const MIRROR: TCard = { name: 'Mirror', value: 0, color: 'spades', isMagicCard: true };
const CLEAR_ALL: TCard = { name: 'Clear all', value: 10, color: 'diamonds', isMagicCard: true };
const CALL_NEXT: TCard = { name: 'Call Next', value: 14, color: 'clubs', isMagicCard: true };
const YOU_LOSE: TCard = { name: 'You lose', value: 9, color: 'hearts', isTeaseCard: true };

/** A section that opens and closes with its heading (closed by default: the home page stays short). */
function Section({ title, children }: { title: string; children: ReactNode }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    return (
        <View className="mt-4 rounded-lg border border-gray-200 bg-white px-4">
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityHint={t('home.toggleHint')}
                onPress={() => setOpen(current => !current)}
                className="flex-row items-center justify-between py-3 active:opacity-60"
            >
                <Text accessibilityRole="header" className="text-xl font-semibold text-gray-800">
                    {title}
                </Text>
                <Text className="text-xl text-gray-500">{open ? '▾' : '▸'}</Text>
            </Pressable>
            {open ? <View className="pb-3">{children}</View> : null}
        </View>
    );
}

/** A special card's rule with its picture beside it. */
function CardRule({ card, i18nKey }: { card: TCard; i18nKey: string }) {
    return (
        <View className="flex-row items-start gap-3">
            <CardFaceArt card={card} width={CARD_PICTURE.width} height={CARD_PICTURE.height} showStamp={false} />
            <Text className="flex-1 text-base leading-6 text-gray-800">
                <Trans i18nKey={i18nKey as never} components={bold} />
            </Text>
        </View>
    );
}

export function AboutSection() {
    const { t } = useTranslation();
    return (
        <View>
            {/* What the game is for, before anything else. */}
            <View accessibilityRole="summary" className="mt-2 flex-row items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-100 px-4 py-3">
                <Text className="text-2xl" importantForAccessibility="no" accessibilityElementsHidden>
                    🍻
                </Text>
                <View className="flex-1 gap-1">
                    <Text className="text-base font-semibold text-gray-900">{t('home.friendsNote')}</Text>
                    <Text className="text-sm text-gray-700">{t('home.botsNote')}</Text>
                </View>
            </View>
            <SectionHeading className="mt-4">{t('home.about.title')}</SectionHeading>
            <Paragraph>{t('home.about.text')}</Paragraph>
        </View>
    );
}

export function HowTheGameWorksSection() {
    const { t } = useTranslation();
    return (
        <Section title={t('home.how.title')}>
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
        </Section>
    );
}

export function CardsSection() {
    const { t } = useTranslation();
    return (
        <Section title={t('home.cards.title')}>
            <Paragraph>{t('home.cards.intro')}</Paragraph>

            <SubHeading>{t('home.cards.magicTitle')}</SubHeading>
            <View className="my-3 gap-4">
                <CardRule card={START_OVER} i18nKey="home.cards.startOver" />
                <CardRule card={MIRROR} i18nKey="home.cards.mirror" />
                <CardRule card={CLEAR_ALL} i18nKey="home.cards.clearAll" />
                <CardRule card={CALL_NEXT} i18nKey="home.cards.callNext" />
            </View>

            <SubHeading>{t('home.cards.teaseTitle')}</SubHeading>
            <View className="my-3">
                <CardRule card={YOU_LOSE} i18nKey="home.cards.youLose" />
            </View>

            <SubHeading>{t('home.cards.simpleTitle')}</SubHeading>
            <Paragraph>
                <Trans i18nKey="home.cards.simple" components={bold} />
            </Paragraph>
        </Section>
    );
}

import { useState, type ReactNode } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { CARD_SUITS, type CardRank, type CardSuit, type TCard } from '@dutch-pub/shared';

import { CardBackArt, CardFaceArt, type CardBackColor } from '@/components/cards';
import { cardDimensions, type CardSize } from '@/components/game/cardSize';
import { PlayingCard } from '@/components/game/PlayingCard';
import { SegmentedControl } from '@/components/ui';

/**
 * Dev-only preview of the new card art (UI-PLAN.md U2): the RevK / Goodall & Son deck at the
 * game's card sizes next to the current `PlayingCard`, all ranks of a suit, the courts, the
 * backs and the special-card stamps. Open it at /dev/cards in the browser (dev builds only).
 * Card sizes follow this window, or a 780x360 landscape phone (`/dev/cards?phone=1`, for
 * screenshots); the old `PlayingCard` always follows the window.
 */

/** A typical phone in landscape (the game screen), in dp. */
const PHONE = { width: 780, height: 360 };

const SIZES: CardSize[] = ['lg', 'md', 'sm', 'xs', 'xxs'];
const RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_VALUE: Record<CardRank, number> = { A: 14, '8': 0, J: 11, Q: 12, K: 13, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '9': 9, '10': 10 };
const NAMES: Record<number, string> = { 0: 'Mirror', 2: 'Start Over', 9: 'You lose', 10: 'Clear all', 11: 'J', 12: 'Q', 13: 'K', 14: 'Call Next' };
const MAGIC = new Set([0, 2, 10, 14]);

const card = (rank: CardRank, suit: CardSuit, special = true): TCard => {
    const value = RANK_VALUE[rank];
    return {
        name: NAMES[value] ?? String(value),
        value,
        color: suit,
        ...(special && MAGIC.has(value) ? { isMagicCard: true } : {}),
        ...(special && value === 9 ? { isTeaseCard: true } : {}),
    };
};

/** The samples asked for in the plan: A♠, 7♥, 10♦, J♣, Q♥, K♠ (as plain cards, no stamps). */
const SAMPLES: [CardRank, CardSuit][] = [
    ['A', 'spades'],
    ['7', 'hearts'],
    ['10', 'diamonds'],
    ['J', 'clubs'],
    ['Q', 'hearts'],
    ['K', 'spades'],
];
const SPECIALS: [CardRank, CardSuit][] = [
    ['10', 'hearts'],
    ['8', 'clubs'],
    ['9', 'spades'],
    ['2', 'diamonds'],
    ['A', 'hearts'],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View className="mb-6">
            <Text className="mb-2 text-base font-bold text-white">{title}</Text>
            {children}
        </View>
    );
}

function Row({ label, children }: { label?: string; children: ReactNode }) {
    return (
        <View className="mb-3">
            {label ? <Text className="mb-1 text-xs text-green-100">{label}</Text> : null}
            <View className="flex-row flex-wrap items-end gap-2">{children}</View>
        </View>
    );
}

type Dims = { width: number; height: number };

function NewCard({ c, dims, showStamp }: { c: TCard; dims: Dims; showStamp: boolean }) {
    return <CardFaceArt card={c} width={dims.width} height={dims.height} showStamp={showStamp} />;
}

function NewBack({ dims, color }: { dims: Dims; color: CardBackColor }) {
    return <CardBackArt width={dims.width} height={dims.height} color={color} />;
}

export default function CardsPreview() {
    const [suit, setSuit] = useState<CardSuit>('hearts');
    const [backColor, setBackColor] = useState<CardBackColor>('red');
    const [stamps, setStamps] = useState<'on' | 'off'>('on');
    const params = useLocalSearchParams<{ phone?: string }>();
    const [basis, setBasis] = useState<'window' | 'phone'>(params.phone === '1' ? 'phone' : 'window');
    const window = useWindowDimensions();
    const dims = (size: CardSize) => cardDimensions(basis === 'phone' ? PHONE : window, size);
    const md = dims('md');

    if (!__DEV__) return <Redirect href="/" />;

    return (
        <ScrollView style={{ backgroundColor: '#1f5130' }} contentContainerStyle={{ padding: 16 }}>
            <Text className="mb-4 text-sm text-green-100">
                New art: RevK SVG playing cards (Goodall &amp; Son court figures, CC0). Sizes follow the game ({md.width}x
                {md.height} dp for md).
            </Text>
            <SegmentedControl
                className="mb-4 self-start"
                accessibilityLabel="Card sizes"
                options={[
                    { label: 'Sizes: this window', value: 'window' },
                    { label: 'Sizes: phone 780x360', value: 'phone' },
                ]}
                value={basis}
                onChange={setBasis}
            />

            <Section title="Samples: new art">
                {SIZES.map(size => (
                    <Row key={size} label={size}>
                        {SAMPLES.map(([r, s]) => (
                            <NewCard key={r + s} c={card(r, s, false)} dims={dims(size)} showStamp={false} />
                        ))}
                        <NewBack dims={dims(size)} color={backColor} />
                    </Row>
                ))}
                <Row label="36 x 50 dp (forced size)">
                    {SAMPLES.map(([r, s]) => (
                        <CardFaceArt key={r + s} rank={r} suit={s} width={36} height={50} />
                    ))}
                    <CardBackArt width={36} height={50} color={backColor} />
                </Row>
            </Section>

            <Section title="Samples: current PlayingCard">
                {(['md', 'xs'] as const).map(size => (
                    <Row key={size} label={size}>
                        {SAMPLES.map(([r, s]) => (
                            <PlayingCard key={r + s} card={card(r, s, false)} size={size} />
                        ))}
                        <PlayingCard faceDown size={size} />
                    </Row>
                ))}
            </Section>

            <Section title="All ranks">
                <SegmentedControl
                    className="mb-3 self-start"
                    accessibilityLabel="Suit"
                    options={CARD_SUITS.map(s => ({ label: s, value: s }))}
                    value={suit}
                    onChange={setSuit}
                />
                <Row label="md">
                    {RANKS.map(r => (
                        <NewCard key={r} c={card(r, suit, false)} dims={dims('md')} showStamp={false} />
                    ))}
                </Row>
                <Row label="xs">
                    {RANKS.map(r => (
                        <NewCard key={r} c={card(r, suit, false)} dims={dims('xs')} showStamp={false} />
                    ))}
                </Row>
            </Section>

            <Section title="Courts (lg)">
                {CARD_SUITS.map(s => (
                    <Row key={s}>
                        {(['J', 'Q', 'K'] as const).map(r => (
                            <NewCard key={r} c={card(r, s)} dims={dims('lg')} showStamp={false} />
                        ))}
                    </Row>
                ))}
            </Section>

            <Section title="Backs">
                <SegmentedControl
                    className="mb-3 self-start"
                    accessibilityLabel="Back colour"
                    options={[
                        { label: 'red', value: 'red' },
                        { label: 'blue', value: 'blue' },
                    ]}
                    value={backColor}
                    onChange={setBackColor}
                />
                <Row>
                    {SIZES.map(size => (
                        <NewBack key={size} dims={dims(size)} color={backColor} />
                    ))}
                </Row>
            </Section>

            <Section title="Special cards: stamps">
                <SegmentedControl
                    className="mb-3 self-start"
                    accessibilityLabel="Stamps"
                    options={[
                        { label: 'Stamps on', value: 'on' },
                        { label: 'Stamps off', value: 'off' },
                    ]}
                    value={stamps}
                    onChange={setStamps}
                />
                {SIZES.map(size => (
                    <Row key={size} label={size}>
                        {SPECIALS.map(([r, s]) => (
                            <NewCard key={r + s} c={card(r, s)} dims={dims(size)} showStamp={stamps === 'on'} />
                        ))}
                    </Row>
                ))}
            </Section>
        </ScrollView>
    );
}

import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { canLayCard, type Cards, type ChatMessage, type Game, type Opponents, type TCard } from '@dutch-pub/shared';

import { GameTable, TableThemeProvider, useAnyOrientationWhileFocused, useTableLayout, type TableMode } from '@/components/game';

/**
 * Dev-only preview of the game table with mock data (UI-PLAN.md U0): check layout and card
 * looks without starting a real game on two devices. Open it from the Account tab (dev
 * builds only) or at /dev/table in the browser. Cards can be played on the mock pile.
 * Turn the phone or resize the browser window to see the portrait and the wide layout; the
 * first chip says which one is shown. The starting state can be set in the URL (for
 * screenshots), e.g. /dev/table?opponents=3&hand=2&many=1&turn=other&panel=0.
 */

const SUITS = ['hearts', 'spades', 'diamonds', 'clubs'] as const;
const NAMES: Record<number, string> = {
    0: 'Mirror',
    2: 'Start Over',
    9: 'You lose',
    10: 'Clear all',
    11: 'J',
    12: 'Q',
    13: 'K',
    14: 'Call Next',
};
const MAGIC = new Set([0, 2, 10, 14]);

const card = (value: number, suit: (typeof SUITS)[number]): TCard => ({
    name: NAMES[value] ?? String(value),
    value,
    color: suit,
    ...(MAGIC.has(value) ? { isMagicCard: true } : {}),
    ...(value === 9 ? { isTeaseCard: true } : {}),
});

/** A deterministic mix of every value and suit. */
const VALUES = [3, 4, 5, 6, 7, 0, 9, 10, 11, 12, 13, 14, 2];
const deal = (count: number, offset = 0): Cards =>
    Array.from({ length: count }, (_, i) => card(VALUES[(i + offset) % VALUES.length], SUITS[(i + offset) % SUITS.length]));

const OPPONENT_NAMES = ['Julcsi', 'lacika', 'Bence'];
const HAND_SIZES = [0, 3, 8, 15];
/** Opponents' hand sizes: a few cards, or so many that the fans compress ("×N"). */
const OPPONENT_HANDS = { few: [3, 7, 5], many: [9, 14, 20] };
/** Turn order for the seats: you first, so Julcsi sits next (left with 4 players). */
const PLAYER_ORDER = ['test', ...OPPONENT_NAMES];
/** Chosen avatars of the mock players (UI-PLAN.md U6); the others get the one generated from their name. */
const AVATARS = { lacika: 'owl' };

function mockGame(opponents: number, handSize: number, piles: boolean, yourTurn: boolean, many: boolean): Game {
    const others: Opponents = {};
    OPPONENT_NAMES.slice(0, opponents).forEach((name, i) => {
        others[name] = {
            hand: OPPONENT_HANDS[many ? 'many' : 'few'][i],
            table: 3,
            tableFlipped: i === 1 ? deal(2, 7) : deal(3, 4 + i),
            active: !yourTurn && i === 0,
        };
    });
    return {
        userCards: { hand: deal(handSize).sort((a, b) => a.value - b.value), table: 3, tableFlipped: deal(3, 9) },
        active: yourTurn,
        opponents: others,
        deck: piles ? 21 : 0,
        laidCards: piles ? [card(5, 'hearts'), card(4, 'clubs')] : null,
        burntCards: piles ? deal(6, 2) : null,
    };
}

const MESSAGES: ChatMessage[] = [
    { id: 1, senderName: 'Julcsi', message: 'Hi!', time: '17:09' },
];

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <Pressable accessibilityRole="button" onPress={onPress} className="rounded-full bg-gray-800 px-3 py-1">
            <Text className="text-xs font-semibold text-white">{label}</Text>
        </Pressable>
    );
}

export default function TablePreview() {
    useAnyOrientationWhileFocused();
    const layout = useTableLayout();
    const window = useWindowDimensions();
    const params = useLocalSearchParams<{ opponents?: string; hand?: string; many?: string; turn?: string; panel?: string }>();
    const [opponents, setOpponents] = useState(() => Math.min(3, Math.max(1, Number(params.opponents) || 2)));
    const [handIndex, setHandIndex] = useState(() => Math.min(HAND_SIZES.length - 1, Math.max(0, Number(params.hand ?? 1) || 0)));
    const [piles, setPiles] = useState(true);
    const [yourTurn, setYourTurn] = useState(params.turn !== 'other');
    const [many, setMany] = useState(params.many === '1');
    const [mode, setMode] = useState<TableMode>('day');
    const [showCardPowers, setShowCardPowers] = useState(true);
    const [cardBack, setCardBack] = useState<'red' | 'blue'>('red');
    const [panelOpen, setPanelOpen] = useState(params.panel !== '0');
    const [game, setGame] = useState(() => mockGame(opponents, HAND_SIZES[handIndex], piles, yourTurn, many));

    if (!__DEV__) return <Redirect href="/" />;

    const rebuild = (next: { opponents?: number; handIndex?: number; piles?: boolean; yourTurn?: boolean; many?: boolean }) => {
        const o = next.opponents ?? opponents;
        const h = next.handIndex ?? handIndex;
        const p = next.piles ?? piles;
        const t = next.yourTurn ?? yourTurn;
        const m = next.many ?? many;
        setOpponents(o);
        setHandIndex(h);
        setPiles(p);
        setYourTurn(t);
        setMany(m);
        setGame(mockGame(o, HAND_SIZES[h], p, t, m));
    };

    // Plays on the mock pile: hand, then face-up, then face-down (by index), like the server.
    const layCard = (played: TCard | number): boolean => {
        const { hand, tableFlipped, table } = game.userCards;
        if (typeof played === 'number') {
            setGame({ ...game, userCards: { ...game.userCards, table: table - 1 }, laidCards: [deal(1, played + 5)[0], ...(game.laidCards ?? [])] });
            return true;
        }
        if (!canLayCard(played, game.laidCards)) return false;
        const without = (cards: Cards) => {
            const i = cards.findIndex(c => c.value === played.value && c.color === played.color);
            return cards.filter((_, j) => j !== i);
        };
        const fromHand = hand.length > 0;
        setGame({
            ...game,
            userCards: {
                hand: fromHand ? without(hand) : hand,
                tableFlipped: fromHand ? tableFlipped : without(tableFlipped),
                table,
            },
            laidCards: [played, ...(game.laidCards ?? [])],
        });
        return true;
    };

    return (
        <TableThemeProvider mode={mode}>
            <GameTable
                game={game}
                active={!!game.active}
                username="test"
                playerOrder={PLAYER_ORDER}
                avatars={AVATARS}
                onLayCard={layCard}
                messages={MESSAGES}
                onSendMessage={() => true}
                canSendMessage
                cardSettings={{ showCardPowers, cardBack }}
            />
            <View className="absolute right-2 top-2 items-end gap-1" pointerEvents="box-none">
                <Chip
                    label={panelOpen ? `Hide (${layout} ${Math.round(window.width)}×${Math.round(window.height)})` : 'Preview'}
                    onPress={() => setPanelOpen(!panelOpen)}
                />
                {panelOpen ? (
                    <View className="items-end gap-1">
                        <Chip label={`Opponents: ${opponents}`} onPress={() => rebuild({ opponents: (opponents % 3) + 1 })} />
                        <Chip
                            label={`Hand: ${HAND_SIZES[handIndex]}`}
                            onPress={() => rebuild({ handIndex: (handIndex + 1) % HAND_SIZES.length })}
                        />
                        <Chip label={many ? 'Opp. hands: many' : 'Opp. hands: few'} onPress={() => rebuild({ many: !many })} />
                        <Chip label={piles ? 'Piles: full' : 'Piles: empty'} onPress={() => rebuild({ piles: !piles })} />
                        <Chip label={yourTurn ? 'Turn: you' : 'Turn: Julcsi'} onPress={() => rebuild({ yourTurn: !yourTurn })} />
                        <Chip label={`Mode: ${mode}`} onPress={() => setMode(mode === 'day' ? 'night' : 'day')} />
                        <Chip label={showCardPowers ? 'Powers: shown' : 'Powers: hidden'} onPress={() => setShowCardPowers(!showCardPowers)} />
                        <Chip label={`Backs: ${cardBack}`} onPress={() => setCardBack(cardBack === 'red' ? 'blue' : 'red')} />
                        <Chip label="Reset" onPress={() => rebuild({})} />
                        <Chip label="Close" onPress={() => router.back()} />
                    </View>
                ) : null}
            </View>
        </TableThemeProvider>
    );
}

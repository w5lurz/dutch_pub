import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { canLayCard, EMOTES, type Cards, type ChatMessage, type Game, type Opponents, type TCard } from '@dutch-pub/shared';
import { showEmote } from '@/lib/emotes';

import { GameTable, summonVisitor, TableThemeProvider, useAnyOrientationWhileFocused, useTableLayout } from '@/components/game';

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
    const params = useLocalSearchParams<{ opponents?: string; hand?: string; many?: string; turn?: string; panel?: string; swap?: string; streak?: string }>();
    const [opponents, setOpponents] = useState(() => Math.min(3, Math.max(1, Number(params.opponents) || 2)));
    const [handIndex, setHandIndex] = useState(() => Math.min(HAND_SIZES.length - 1, Math.max(0, Number(params.hand ?? 1) || 0)));
    const [piles, setPiles] = useState(true);
    const [yourTurn, setYourTurn] = useState(params.turn !== 'other');
    const [many, setMany] = useState(params.many === '1');
    const [showCardPowers, setShowCardPowers] = useState(true);
    const [cardBack, setCardBack] = useState<'red' | 'blue'>('red');
    const [panelOpen, setPanelOpen] = useState(params.panel !== '0');
    // `?swap=1`: opens in the swap phase (as right after the deal). `?streak=5`: five games in a row (cans).
    const [game, setGame] = useState<Game>(() => {
        const dealt = { ...mockGame(opponents, HAND_SIZES[handIndex], piles, yourTurn, many), streak: Number(params.streak) || 1 };
        return params.swap === '1' ? { ...dealt, phase: 'swap' as const, ready: false, laidCards: null, burntCards: null } : dealt;
    });
    const [winner, setWinner] = useState<string | null>(null);
    // The ashtray's cigarettes (by night): another seed, other cigarettes.
    const [tableSeed, setTableSeed] = useState(1);

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
        setWinner(null);
    };

    // Plays on the mock pile: hand, then face-up, then face-down (by index), like the server.
    const layCard = (played: TCard | number | Cards): boolean => {
        const { hand, tableFlipped, table } = game.userCards;
        if (typeof played === 'number') {
            setGame({ ...game, userCards: { ...game.userCards, table: table - 1 }, laidCards: [deal(1, played + 5)[0], ...(game.laidCards ?? [])] });
            return true;
        }
        // One card, or several of the same value laid together (the last one ends up on top).
        const cards = Array.isArray(played) ? played : [played];
        if (cards.some(c => c.value !== cards[0].value) || !canLayCard(cards[0], game.laidCards)) return false;
        const without = (from: Cards) => {
            const rest = [...from];
            for (const laid of cards) {
                const i = rest.findIndex(c => c.value === laid.value && c.color === laid.color);
                if (i >= 0) rest.splice(i, 1);
            }
            return rest;
        };
        const fromHand = hand.length > 0;
        // Like the real game: refill the hand to 3 from the deck; a 10 or four of a kind on top burns the pile.
        let newHand = fromHand ? without(hand) : hand;
        let deck = game.deck;
        while (fromHand && newHand.length < 3 && deck > 0) {
            newHand = [...newHand, deal(1, deck * 3)[0]].sort((a, b) => a.value - b.value);
            deck -= 1;
        }
        const pile = [...[...cards].reverse(), ...(game.laidCards ?? [])];
        let run = 0;
        while (run < pile.length && pile[run].value === pile[0].value) run++;
        const burns = cards[0].value === 10 || run >= 4;
        setGame({
            ...game,
            deck,
            userCards: { hand: newHand, tableFlipped: fromHand ? tableFlipped : without(tableFlipped), table },
            laidCards: burns ? null : pile,
            burntCards: burns ? [...pile, ...(game.burntCards ?? [])] : game.burntCards,
        });
        return true;
    };

    // Picks up the laid pile into your hand (as when you cannot play).
    const pickUp = () =>
        setGame({
            ...game,
            userCards: {
                ...game.userCards,
                hand: [...game.userCards.hand, ...(game.laidCards ?? [])].sort((a, b) => a.value - b.value),
            },
            laidCards: null,
        });

    // Swap phase: as right after the deal (opponents get ready one by one when you are).
    const startSwap = () => setGame({ ...game, phase: 'swap', ready: false, laidCards: null, burntCards: null });
    const swapCards = (hand: TCard, faceUp: TCard) => {
        const { userCards } = game;
        const i = userCards.hand.findIndex(c => c.value === hand.value && c.color === hand.color);
        const j = userCards.tableFlipped.findIndex(c => c.value === faceUp.value && c.color === faceUp.color);
        if (i < 0 || j < 0) return;
        const newHand = [...userCards.hand];
        const newFaceUp = [...userCards.tableFlipped];
        newHand[i] = faceUp;
        newFaceUp[j] = hand;
        setGame({ ...game, userCards: { ...userCards, hand: newHand, tableFlipped: newFaceUp } });
    };
    const ready = () => {
        const opponentsReady = Object.fromEntries(Object.entries(game.opponents).map(([name, o]) => [name, { ...o, ready: true }]));
        setGame({ ...game, ready: true, opponents: opponentsReady });
        setTimeout(() => setGame(current => ({ ...current, phase: 'play' })), 1500);
    };
    // A missed blind card (Julcsi's): on the pile for 3 s, then she picks the pile up.
    const blindMiss = () => {
        const missed = card(4, 'spades');
        const pile = [missed, card(12, 'hearts'), ...(game.laidCards ?? [])];
        setGame({ ...game, laidCards: pile, blindMiss: { username: 'Julcsi', card: missed } });
        setTimeout(
            () =>
                setGame(current => ({
                    ...current,
                    blindMiss: null,
                    laidCards: null,
                    opponents: { ...current.opponents, Julcsi: { ...current.opponents.Julcsi, hand: current.opponents.Julcsi.hand + pile.length } },
                })),
            3000,
        );
    };

    // Turn timer: 15 s for whoever is on turn (restarts with each change of the mock game); again: off.
    const toggleTimer = () =>
        setGame(game.turnTimeLeft != null ? { ...game, turnTimeLeft: null, turnTime: null } : { ...game, turnTimeLeft: 15000, turnTime: 15000 });

    // A big pick-up (8 cards, as if the pile had them): the librarian comes, for you or for Julcsi.
    const bigPickUp = (who: 'you' | 'Julcsi') => {
        const cards = deal(8, 3);
        if (who === 'you') {
            setGame({ ...game, userCards: { ...game.userCards, hand: [...game.userCards.hand, ...cards].sort((a, b) => a.value - b.value) }, laidCards: null });
        } else {
            const julcsi = game.opponents.Julcsi;
            setGame({ ...game, opponents: { ...game.opponents, Julcsi: { ...julcsi, hand: julcsi.hand + cards.length } }, laidCards: null });
        }
    };

    return (
        <TableThemeProvider>
            <GameTable
                game={game}
                active={!!game.active}
                username="test"
                playerOrder={PLAYER_ORDER}
                avatars={AVATARS}
                onLayCard={layCard}
                tableSeed={tableSeed}
                messages={MESSAGES}
                onSendMessage={() => true}
                onSendEmote={(emote) => showEmote({ username: 'test', emote })}
                canSendMessage
                cardSettings={{ showCardPowers, cardBack }}
                onStopGame={() => router.back()}
                winner={winner}
                onSwapCards={swapCards}
                onReady={ready}
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
                        <Chip label={showCardPowers ? 'Powers: shown' : 'Powers: hidden'} onPress={() => setShowCardPowers(!showCardPowers)} />
                        <Chip label={`Backs: ${cardBack}`} onPress={() => setCardBack(cardBack === 'red' ? 'blue' : 'red')} />
                        <Chip label="Pick up pile" onPress={pickUp} />
                        <Chip label="Swap phase" onPress={startSwap} />
                        <Chip label="Blind miss" onPress={blindMiss} />
                        <Chip label={game.turnTimeLeft != null ? 'Timer: on' : 'Timer: off'} onPress={toggleTimer} />
                        <Chip label={`Cigarette ${tableSeed}`} onPress={() => setTableSeed(tableSeed + 1)} />
                        <Chip label="Librarian: you" onPress={() => bigPickUp('you')} />
                        <Chip label="Librarian: Julcsi" onPress={() => bigPickUp('Julcsi')} />
                        <Chip label={`Cans: ${game.streak ?? 1} games`} onPress={() => setGame({ ...game, streak: ((game.streak ?? 1) % 9) + 1 })} />
                        <Chip label="Pick-up banner" onPress={() => setGame({ ...game, pickedUp: game.pickedUp ? null : { username: 'Julcsi', count: 3 } })} />
                        {EMOTES.map((emote) => (
                            <Chip key={emote} label={`Julcsi: ${emote}`} onPress={() => showEmote({ username: 'Julcsi', emote })} />
                        ))}
                        <Chip label="Win: you" onPress={() => setWinner('test')} />
                        <Chip label="Win: Julcsi" onPress={() => setWinner('Julcsi')} />
                        <Chip label="Bee" onPress={() => summonVisitor('bee')} />
                        <Chip label="Butterfly" onPress={() => summonVisitor('butterfly')} />
                        <Chip label="Frisbee" onPress={() => summonVisitor('frisbee')} />
                        <Chip label="Reset" onPress={() => rebuild({})} />
                        <Chip label="Close" onPress={() => router.back()} />
                    </View>
                ) : null}
            </View>
        </TableThemeProvider>
    );
}

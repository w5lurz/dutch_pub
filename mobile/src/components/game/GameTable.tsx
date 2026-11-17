import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import type { ChatMessage, Game, TCard } from '@dutch-pub/shared';

import { Screen } from '@/components/ui';

import { CardDragProvider } from './CardDrag';
import { CardSettingsProvider, type CardSettings } from './cardSettings';
import { tableLayout } from './cardSize';
import { ChatButton } from './ChatButton';
import { ChatModal } from './ChatModal';
import { PileArea } from './PileArea';
import { PlayerBoard } from './PlayerBoard';
import { Seat } from './Seat';
import { seatPositions, type SeatPosition } from './seats';
import { TableBackground } from './TableBackground';
import { useTableTheme } from './tableTheme';

export type GameTableProps = {
    game: Game;
    /** Whether it is your turn. */
    active: boolean;
    username?: string;
    /**
     * Turn order of all players (you included), e.g. the room's player list. Seats follow it
     * clockwise. Without it (or for names missing from it) the opponents' order is used.
     */
    playerOrder?: readonly string[];
    /**
     * Chosen avatar ids by username (you included), e.g. from the room's player list. Players
     * missing from it (or with null) get the avatar generated from their name.
     */
    avatars?: Readonly<Record<string, string | null | undefined>>;
    /** Plays a card; returns whether the move was legal (see `useGameActions.layCard`). */
    onLayCard: (card: TCard | number, cardIndex: number, touchable: boolean) => boolean;
    messages: ChatMessage[];
    onSendMessage: (message: string) => boolean;
    canSendMessage: boolean;
    /** The room's card settings (special-card stamps, back colour); room defaults if omitted. */
    cardSettings?: Partial<CardSettings>;
};

/** Below this window height your hand covers half of your table stacks (a phone turned sideways). */
const SHORT_HEIGHT = 600;
/** Below this window width the portrait piles shrink when seats sit beside them (4 players). */
const NARROW_WIDTH = 600;

/**
 * The game table: opponents seated around it, deck / laid / burnt piles in the centre, your
 * table cards and hand at the bottom, and the chat. Two layouts, by the window's aspect
 * ratio (`tableLayout`): portrait (phones upright) and wide (tablets in landscape, the
 * desktop browser, phones turned sideways); see `seatPositions` for who sits where.
 * Purely presentational (data and actions come in as props), so the game screen and the
 * dev preview screen render the same thing. Cards are played by dragging them onto the
 * laid pile (`CardDragProvider`).
 */
export function GameTable({
    game,
    active,
    username,
    playerOrder,
    avatars,
    onLayCard,
    messages,
    onSendMessage,
    canSendMessage,
    cardSettings,
}: GameTableProps) {
    const { paletteClass } = useTableTheme();
    const window = useWindowDimensions();
    const layout = tableLayout(window);

    // Chat: unread = messages that arrived while the modal was closed.
    const [chatOpen, setChatOpen] = useState(false);
    const [seenCount, setSeenCount] = useState(messages.length);
    if (messages.length < seenCount) {
        // History was replaced by a shorter one (new room / re-sync): adjust during render.
        setSeenCount(messages.length);
    }
    const unread = chatOpen ? 0 : messages.length - seenCount;
    const toggleChat = (open: boolean) => {
        setSeenCount(messages.length);
        setChatOpen(open);
    };

    const activeOpponent = Object.entries(game.opponents).find(([, opponent]) => opponent.active)?.[0];
    const turnOf = active ? null : activeOpponent;

    // Seats: the known turn order (only players still in the game), then anyone missing from it.
    const opponentNames = Object.keys(game.opponents);
    const known = (playerOrder ?? []).filter(name => name === username || name in game.opponents);
    const order = [...known, ...opponentNames.filter(name => !known.includes(name))];
    const seats = seatPositions(order, username, layout);
    const seatAt = (position: SeatPosition) =>
        seats
            .filter(seat => seat.position === position)
            .map(seat => (
                <Seat
                    key={seat.name}
                    name={seat.name}
                    opponent={game.opponents[seat.name]}
                    position={position}
                    layout={layout}
                    avatarId={avatars?.[seat.name]}
                />
            ));
    const hasSides = seats.some(seat => seat.position === 'left' || seat.position === 'right');
    // Smaller piles: portrait with seats beside them on a narrow window, or a short window (your
    // bigger hand needs the height, e.g. a phone turned sideways).
    const narrowPiles = (layout === 'portrait' && hasSides && window.width < NARROW_WIDTH) || window.height < SHORT_HEIGHT;
    // 3 players in the wide layout: the side seats sit in the upper half.
    const sidesHigh = layout === 'wide' && seats.length === 2;

    return (
        // The table's own palette (light on the white table, also in dark mode).
        <View className={`${paletteClass} flex-1`}>
            <TableBackground layout={layout} />
            <Screen edges={['top', 'bottom', 'left', 'right']} padded={false} background="none">
                <CardSettingsProvider settings={cardSettings}>
                    <CardDragProvider>
                        <View className="flex-row items-start justify-around px-2 pt-1" accessibilityLabel={`Opponents, ${seats.length}`}>
                            {seatAt('top-left')}
                            {seatAt('top')}
                            {seatAt('top-right')}
                        </View>

                        {/* minHeight 0: the row may get shorter than the side seats; they then reach down beside
                            your cards (which are centred), and your hand always stays fully on screen. */}
                        <View className={`flex-1 flex-row ${sidesHigh ? 'items-start' : 'items-center'}`} style={{ minHeight: 0 }}>
                            <View className={layout === 'wide' ? 'pl-4' : 'pl-1'}>{seatAt('left')}</View>
                            <View className="flex-1 items-center justify-center self-stretch">
                                <PileArea
                                    deck={game.deck}
                                    laidCards={game.laidCards}
                                    burntCards={game.burntCards}
                                    turnOf={turnOf}
                                    size={narrowPiles ? 'md' : 'lg'}
                                    tight={narrowPiles}
                                />
                            </View>
                            <View className={layout === 'wide' ? 'pr-4' : 'pr-1'}>{seatAt('right')}</View>
                        </View>

                        <PlayerBoard
                            userCards={game.userCards}
                            laidCards={game.laidCards}
                            active={active}
                            username={username}
                            avatar={username ? avatars?.[username] : undefined}
                            onLayCard={onLayCard}
                            handSize={layout === 'wide' ? 'lg' : 'md'}
                            overlapStacks={window.height < SHORT_HEIGHT}
                            corner={<ChatButton unread={unread} onPress={() => toggleChat(true)} />}
                        />
                    </CardDragProvider>
                </CardSettingsProvider>

                <ChatModal
                    visible={chatOpen}
                    onClose={() => toggleChat(false)}
                    messages={messages}
                    username={username}
                    onSend={onSendMessage}
                    canSend={canSendMessage}
                />
            </Screen>
        </View>
    );
}

export default GameTable;

import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ChatMessage, Game, TCard } from '@dutch-pub/shared';

import { Screen } from '@/components/ui';

import { Ashtray } from './Ashtray';
import { CardDragProvider } from './CardDrag';
import { CardSettingsProvider, type CardSettings } from './cardSettings';
import { tableLayout, useCardSize, type CardSize } from './cardSize';
import { ChatButton } from './ChatButton';
import { ChatModal } from './ChatModal';
import { PileArea } from './PileArea';
import { PlayerBoard } from './PlayerBoard';
import { Seat } from './Seat';
import { seatPositions, type SeatPosition } from './seats';
import { LampButton } from './LampButton';
import { Moth } from './Moth';
import { DayVisitors } from './DayVisitors';
import { TableBackground } from './TableBackground';
import { TableLamp } from './TableLamp';
import { TableLighting } from './TableLighting';
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
/** Below this window height the portrait pile column uses smaller cards (it stacks three cards). */
const COLUMN_SHORT_HEIGHT = 800;

/**
 * The game table: opponents seated around it, deck / laid / burnt piles in the centre, your
 * table cards and hand at the bottom, and the chat. Two layouts, by the window's aspect
 * ratio (`tableLayout`): portrait (phones upright) and wide (tablets in landscape, the
 * desktop browser, phones turned sideways); see `seatPositions` for who sits where.
 * Purely presentational (data and actions come in as props), so the game screen and the
 * dev preview screen render the same thing. Cards are played by dragging them onto the
 * laid pile (`CardDragProvider`). At night (`TableThemeProvider`, the lamp switch in the
 * bottom-right corner) the table is lit by a lamp (`TableLighting`).
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
	const insets = useSafeAreaInsets();
	const layout = tableLayout(window);
	const short = window.height < SHORT_HEIGHT;
	const { height: cardHeight } = useCardSize('md');

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
	const known = (playerOrder ?? []).filter((name) => name === username || name in game.opponents);
	const order = [...known, ...opponentNames.filter((name) => !known.includes(name))];
	const seats = seatPositions(order, username, layout);
	const seatAt = (position: SeatPosition) =>
		seats
			.filter((seat) => seat.position === position)
			.map((seat) => (
				<Seat
					key={seat.name}
					name={seat.name}
					opponent={game.opponents[seat.name]}
					position={position}
					layout={layout}
					avatarId={avatars?.[seat.name]}
					// A phone turned sideways: the top seat in one row, close to the table's edge.
					compact={layout === 'wide' && short}
				/>
			));
	const hasSides = seats.some((seat) => seat.position === 'left' || seat.position === 'right');
	// Portrait with seats beside the piles (4 players): the piles stand in a column between the
	// side seats (at the table's edges), so they need little width.
	const pilesColumn = layout === 'portrait' && hasSides;
	// Smaller piles on a short window (your bigger hand needs the height, e.g. a phone turned
	// sideways); the column (three cards high) is smaller still unless the window is tall.
	const pileSize: CardSize = pilesColumn
		? short || window.height < COLUMN_SHORT_HEIGHT
			? 'sm'
			: 'md'
		: short
			? 'md'
			: 'lg';
	const piles = (
		<PileArea
			deck={game.deck}
			laidCards={game.laidCards}
			burntCards={game.burntCards}
			turnOf={turnOf}
			size={pileSize}
			tight={short}
			column={pilesColumn}
		/>
	);

	return (
		// The table's own palette (light on the white table, also in dark mode).
		<View className={`${paletteClass} flex-1`}>
			<TableBackground layout={layout} />
			<TableLighting layer="table" />
			{/* Night only: an ashtray with a burning cigarette near the table's bottom-left corner, a bit
                in from the edge (portrait: on the left between the left seat's cards and yours). */}
			<Ashtray
				size={Math.round(cardHeight * (layout === 'portrait' ? 0.75 : 0.85))}
				style={layout === 'portrait' ? { left: '7%', top: '62%' } : { left: '10%', bottom: '13%' }}
			/>
			<Screen edges={['top', 'bottom', 'left', 'right']} padded={false} background="none">
				<CardSettingsProvider settings={cardSettings}>
					<CardDragProvider>
						<View
							className={`flex-row items-start justify-around px-2 ${layout === 'wide' && short ? 'pt-2' : 'pt-1'}`}
							accessibilityLabel={`Opponents, ${seats.length}`}
						>
							{seatAt('top-left')}
							{seatAt('top')}
							{seatAt('top-right')}
						</View>

						{/* minHeight 0: the row may get shorter than the side seats; they then reach down beside
                            your cards (which are centred), and your hand always stays fully on screen. */}
						{layout === 'portrait' && hasSides ? (
							// The side seats at the table's edges, the pile column in the middle.
							<View className="flex-1 flex-row items-center justify-between px-1" style={{ minHeight: 0 }}>
								{seatAt('left')}
								{piles}
								{seatAt('right')}
							</View>
						) : (
							<View className="flex-1 items-center justify-center" style={{ minHeight: 0 }}>
								{piles}
							</View>
						)}

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
							cornerRight={<LampButton />}
						/>

						{layout === 'wide' && hasSides ? (
							// Wide: the side seats at the edges, centred on the whole screen (the safe-area padding
							// undone), so they stay put while your hand grows or shrinks and sit at the table's middle.
							<View
								pointerEvents="box-none"
								className="absolute left-0 right-0 flex-row items-center justify-between px-4"
								style={{ top: -insets.top, bottom: -insets.bottom }}
							>
								<View pointerEvents="box-none">{seatAt('left')}</View>
								<View pointerEvents="box-none">{seatAt('right')}</View>
							</View>
						) : null}
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
			{/* Last: the lamp lights every card the same, the dragged one included (night only). */}
			<TableLighting layer="cards" />
			{/* The lamp itself, hanging above the table at the top edge (it flickers now and then), and a
                moth that sometimes circles it (night only). */}
			<TableLamp insetTop={insets.top} />
			<Moth insetTop={insets.top} />
			{/* By day: a bee, a butterfly or (rarely) a frisbee passing over now and then. */}
			<DayVisitors />
		</View>
	);
}

export default GameTable;

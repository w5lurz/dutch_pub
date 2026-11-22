import { useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import i18n from '@/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CardRules, Cards, ChatMessage, Game, TCard } from '@dutch-pub/shared';

import { Screen } from '@/components/ui';

import { needsAceCall } from './aceCall';
import { AceCallSheet } from './AceCallSheet';
import { Ashtray } from './Ashtray';
import { useBigPickUp } from './bigPickUp';
import { CardDragProvider, measure, type Rect, type ViewRef } from './CardDrag';
import { CardSettingsProvider, type CardSettings } from './cardSettings';
import { tableLayout, useCardSize, type CardSize } from './cardSize';
import { ChatButton } from './ChatButton';
import { ChatModal } from './ChatModal';
import { Librarian } from './Librarian';
import { PileArea } from './PileArea';
import { PlayerBoard } from './PlayerBoard';
import { Seat } from './Seat';
import { ShotGlass, type Point } from './ShotGlass';
import { StopGameButton } from './StopGameButton';
import { SwapPanel } from './SwapPanel';
import { seatPositions, type SeatPosition } from './seats';
import { LampButton } from './LampButton';
import { Moth } from './Moth';
import { DayVisitors } from './DayVisitors';
import { TableBackground } from './TableBackground';
import { TableLamp } from './TableLamp';
import { TableLighting } from './TableLighting';
import { useTableTheme } from './tableTheme';
import { useTurnSecondsLeft } from './TurnCountdown';
import { useGameSounds } from './gameSounds';

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
	/**
	 * Plays a card (or several of the same value at once); returns whether the move was legal (see
	 * `useGameActions.layCard`). `call`: with an Ace, the player who must lay a magic card next.
	 */
	onLayCard: (card: TCard | number | Cards, cardIndex: number, touchable: boolean, call?: string) => boolean;
	/** The room's house rules that change which cards fit (dimmed cards, the Ace check). */
	cardRules?: CardRules;
	/** Picks the table's random details the same on every device (the room id): e.g. the cigarettes. */
	tableSeed?: number;
	messages: ChatMessage[];
	onSendMessage: (message: string) => boolean;
	canSendMessage: boolean;
	/** The room's card settings (special-card stamps, back colour); room defaults if omitted. */
	cardSettings?: Partial<CardSettings>;
	/** Ends the game for everyone; only for the room owner (shows the "Stop game" button above the chat). */
	onStopGame?: () => void;
	/** Who won (set while the game-won message shows): a shot glass slides over to them. */
	winner?: string | null;
	/** Swap phase: your hand card and face-up card trade places. */
	onSwapCards?: (hand: TCard, faceUp: TCard) => void;
	/** Swap phase: you are done swapping. */
	onReady?: () => void;
};

/** Below this window height your hand covers half of your table stacks (a phone turned sideways). */
const SHORT_HEIGHT = 600;
/** Below this window height the portrait pile column uses smaller cards (it stacks three cards). */
const COLUMN_SHORT_HEIGHT = 800;
/** The shot glass's diameter, and its gap to the winner's seat. */
const GLASS_SIZE = 52;
const GLASS_GAP = 10;

/**
 * The shot glass's way, in the table's coordinates: from the table's middle to beside the
 * winner's seat `seat` (window coordinates, like `root`), on the side facing the middle (or
 * the right for seats in the middle: the top seat, you), kept on the table.
 */
export function glassPath(root: Rect, seat: Rect): { from: Point; to: Point } {
	const x = seat.x - root.x;
	const y = seat.y - root.y;
	const middle = root.width / 2;
	const toRight = x + seat.width / 2 <= middle + 20;
	const half = GLASS_SIZE / 2;
	const clamp = (value: number, max: number) => Math.min(max - half - 4, Math.max(half + 4, value));
	return {
		from: { x: middle, y: root.height / 2 },
		to: {
			x: clamp(toRight ? x + seat.width + GLASS_GAP + half : x - GLASS_GAP - half, root.width),
			y: clamp(y + seat.height / 2, root.height),
		},
	};
}

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
	onStopGame,
	winner,
	onSwapCards,
	onReady,
	cardRules,
	tableSeed = 0,
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

	// A big pick-up (more than six cards) calls the librarian, on every device.
	const [bigPickUp, hideLibrarian] = useBigPickUp(game, username);

	// The winner's shot glass: from the table's middle to beside the winner's seat (or your
	// avatar and name), measured once a winner is known.
	const rootRef = useRef<ViewRef | null>(null);
	const avatarRef = useRef<ViewRef | null>(null);
	const seatRefs = useRef(new Map<string, ViewRef>());
	const [glass, setGlass] = useState<{ winner: string; from: Point; to: Point } | null>(null);
	useEffect(() => {
		if (!winner) return;
		let cancelled = false;
		const target = winner === username ? avatarRef.current : (seatRefs.current.get(winner) ?? null);
		Promise.all([measure(rootRef.current), measure(target)]).then(([root, seat]) => {
			if (!cancelled && root && seat) setGlass({ winner, ...glassPath(root, seat) });
		});
		return () => {
			cancelled = true;
		};
	}, [winner, username]);

	const activeOpponent = Object.entries(game.opponents).find(([, opponent]) => opponent.active)?.[0];
	const turnOf = active ? null : activeOpponent;
	// Swap phase (right after the deal): nobody is on turn yet; you can swap until you are ready.
	const swapPhase = game.phase === 'swap';
	// Turn timer: one countdown for whoever is on turn (shown by their name).
	const secondsLeft = useTurnSecondsLeft(game);
	// The table's sounds (a card laid, a burn, a pick-up, the win).
	useGameSounds(game, winner);
	const opponentList = Object.values(game.opponents);
	const readyCount = opponentList.filter((opponent) => opponent.ready).length + (game.ready ? 1 : 0);

	// Seats: the known turn order (only players still in the game), then anyone missing from it.
	const opponentNames = Object.keys(game.opponents);
	const known = (playerOrder ?? []).filter((name) => name === username || name in game.opponents);
	const order = [...known, ...opponentNames.filter((name) => !known.includes(name))];
	const seats = seatPositions(order, username, layout);

	// An Ace dropped on the pile (with 2+ others to choose from): first pick who must lay a magic
	// card; the Ace stays in your hand until then. With one other player it is always them.
	const others = order.filter((name) => name !== username);
	const [aceCall, setAceCall] = useState<{ card: TCard | Cards; cardIndex: number } | null>(null);
	if (aceCall && (!active || swapPhase)) setAceCall(null); // the turn is over (e.g. the timer ran out)
	const layCard = (card: TCard | number | Cards, cardIndex: number, touchable: boolean) => {
		const situation = { touchable, active, swapPhase, others: others.length, laidCards: game.laidCards, rules: cardRules };
		if (!needsAceCall(card, situation)) return onLayCard(card, cardIndex, touchable);
		setAceCall({ card: card as TCard | Cards, cardIndex });
		return false;
	};
	const seatAt = (position: SeatPosition) =>
		seats
			.filter((seat) => seat.position === position)
			.map((seat) => (
				// Measured for the winner's shot glass.
				<View
					key={seat.name}
					pointerEvents="box-none"
					collapsable={false}
					ref={(view) => {
						if (view) seatRefs.current.set(seat.name, view);
						else seatRefs.current.delete(seat.name);
					}}
				>
					<Seat
						name={seat.name}
						opponent={swapPhase ? { ...game.opponents[seat.name], active: false } : game.opponents[seat.name]}
						ready={swapPhase ? !!game.opponents[seat.name].ready : undefined}
						secondsLeft={secondsLeft}
						position={position}
						layout={layout}
						avatarId={avatars?.[seat.name]}
						// A phone turned sideways: the top seat in one row, close to the table's edge.
						compact={layout === 'wide' && short}
					/>
				</View>
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
	const piles = swapPhase ? (
		<SwapPanel
			ready={!!game.ready}
			readyCount={readyCount}
			playerCount={opponentList.length + 1}
			onReady={() => onReady?.()}
			compact={layout === 'wide' && short}
		/>
	) : (
		<PileArea
			deck={game.deck}
			laidCards={game.laidCards}
			burntCards={game.burntCards}
			turnOf={turnOf}
			size={pileSize}
			tight={short}
			column={pilesColumn}
			blindMiss={game.blindMiss}
			username={username}
			call={game.call}
			reversed={game.direction === -1}
		/>
	);

	return (
		// The table's own palette (light on the white table, also in dark mode).
		<View ref={rootRef} collapsable={false} className={`${paletteClass} flex-1`}>
			<TableBackground layout={layout} />
			<TableLighting layer="table" />
			{/* Night only: an ashtray with a burning cigarette near the table's bottom-left corner, a bit
                in from the edge (portrait: on the left between the left seat's cards and yours). */}
			<Ashtray
				seed={tableSeed}
				size={Math.round(cardHeight * (layout === 'portrait' ? 0.75 : 0.85))}
				style={layout === 'portrait' ? { left: '7%', top: '62%' } : { left: '10%', bottom: '13%' }}
			/>
			<Screen edges={['top', 'bottom', 'left', 'right']} padded={false} background="none">
				<CardSettingsProvider settings={cardSettings}>
					<CardDragProvider>
						<View
							className={`flex-row items-start justify-around px-2 ${layout === 'wide' && short ? 'pt-2' : 'pt-1'}`}
							accessibilityLabel={i18n.t('game.opponents', { count: seats.length })}
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
							// While swapping, drawn above your board: on a short window the panel may reach over
							// it, and its Ready button must stay tappable.
							<View className="flex-1 items-center justify-center" style={{ minHeight: 0, zIndex: swapPhase ? 2 : 0, elevation: swapPhase ? 2 : 0 }}>
								{piles}
							</View>
						)}

						<PlayerBoard
							userCards={game.userCards}
							laidCards={game.laidCards}
							active={active && !swapPhase}
							username={username}
							avatar={username ? avatars?.[username] : undefined}
							onLayCard={layCard}
							cardRules={cardRules}
							handSize={layout === 'wide' ? 'lg' : 'md'}
							overlapStacks={window.height < SHORT_HEIGHT}
							youBeside={layout === 'wide'}
							corner={
								<View className="items-center gap-3">
									{onStopGame ? <StopGameButton onStop={onStopGame} /> : null}
									<ChatButton unread={unread} onPress={() => toggleChat(true)} />
								</View>
							}
							cornerRight={<LampButton />}
							avatarRef={avatarRef}
							onSwap={swapPhase && !game.ready ? onSwapCards : undefined}
							secondsLeft={secondsLeft}
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

				<AceCallSheet
					visible={!!aceCall}
					players={others}
					avatars={avatars}
					onCancel={() => setAceCall(null)}
					onCall={(player) => {
						if (aceCall) onLayCard(aceCall.card, aceCall.cardIndex, true, player);
						setAceCall(null);
					}}
				/>
				<ChatModal
					visible={chatOpen}
					onClose={() => toggleChat(false)}
					messages={messages}
					username={username}
					onSend={onSendMessage}
					canSend={canSendMessage}
					avatars={avatars}
				/>
			</Screen>
			{/* The winner's shot, sliding over the table (lit by the lamp at night, like the cards). */}
			{glass && glass.winner === winner ? <ShotGlass from={glass.from} to={glass.to} size={GLASS_SIZE} /> : null}
			{/* Last: the lamp lights every card the same, the dragged one included (night only). */}
			<TableLighting layer="cards" />
			{/* The lamp itself, hanging above the table at the top edge (it flickers now and then), and a
                moth that sometimes circles it (night only). */}
			<TableLamp insetTop={insets.top} />
			<Moth insetTop={insets.top} />
			{/* By day: a bee, a butterfly or (rarely) a frisbee passing over now and then. */}
			<DayVisitors />
			{/* A big pick-up: the librarian comes up and shelves a book, with the player's name. */}
			{bigPickUp ? <Librarian key={bigPickUp.key} name={bigPickUp.name} count={bigPickUp.count} onDone={hideLibrarian} /> : null}
		</View>
	);
}

export default GameTable;

import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import i18n from '@/i18n';
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import type { Opponent } from '@dutch-pub/shared';

import { Avatar } from '@/components/ui';

import { useCardSize, type CardSize, type TableLayout } from './cardSize';
import { HandFan } from './HandFan';
import { Rotated } from './Rotated';
import type { SeatPosition } from './seats';
import { stackOffset, TableStacks, tableSpots, useTableStacksWidth } from './TableStacks';
import { useTableTheme } from './tableTheme';
import { TurnCountdown } from './TurnCountdown';

type SeatAvatarProps = {
    name: string;
    active: boolean;
    /** Diameter in dp. */
    size: number;
    /** The player's chosen avatar id; null / missing: the one generated from the name. */
    avatarId?: string | null;
    /** A picture to show instead of the avatar (e.g. in tests). */
    avatar?: ReactNode;
    /** Close to winning (`isCloseToWinning`): the glow turns orange-red, a red halo when not on turn. */
    danger?: boolean;
};

/** One wave of the turn glow: a green ring growing out of the avatar and fading. */
const WAVE_MS = 1400;
/** A wave of the danger glow (on turn, close to winning): faster. */
const DANGER_WAVE_MS = 700;

/** At most this many cards left in total (hand, face-up, face-down): close to winning. */
export const DANGER_CARDS = 3;

/** Whether a player with `total` cards left is close to winning (but hasn't won). */
export const isCloseToWinning = (total: number) => total > 0 && total <= DANGER_CARDS;

/**
 * The glow around the avatar of whoever is on turn: a steady green halo, and green waves
 * rippling out of it again and again, so you see at a glance whose turn it is. Its own round
 * views, mounted only while on turn (on Android, changing a mounted view's background colour
 * drew it without its border radius: a green square). With "reduce motion": the halo only.
 * `danger` (close to winning): orange-red, rippling twice as fast (callers remount it with a
 * `key` when that changes, for the same Android reason).
 */
function TurnGlow({ size, danger = false }: { size: number; danger?: boolean }) {
    const still = useReducedMotion();
    const wave = useSharedValue(0);
    useEffect(() => {
        if (still) return;
        wave.set(withRepeat(withTiming(1, { duration: danger ? DANGER_WAVE_MS : WAVE_MS, easing: Easing.out(Easing.quad) }), -1, false));
    }, [wave, still, danger]);
    const rippling = useAnimatedStyle(() => ({
        opacity: 0.75 * (1 - wave.get()),
        transform: [{ scale: 1 + wave.get() * 0.55 }],
    }));
    const round = { borderRadius: size / 2 };
    return (
        <>
            {still ? null : (
                <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, round, { borderWidth: 3, borderColor: danger ? '#f97316' : '#22c55e' }, rippling]} // orange-500 / green-500
                />
            )}
            <View
                testID={danger ? 'danger-turn-glow' : 'turn-glow'}
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, round, { backgroundColor: danger ? 'rgba(248, 113, 113, 0.75)' : 'rgba(74, 222, 128, 0.7)' }]} // red-400 / green-400
            />
        </>
    );
}

/** Close to winning, not on turn: a soft steady red halo around the avatar. */
function DangerHalo({ size }: { size: number }) {
    return (
        <View
            testID="danger-halo"
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: 'rgba(239, 68, 68, 0.4)' }]} // red-500 / 40%
        />
    );
}

/** A player's avatar (chosen, or generated from the name: `Avatar`), with `TurnGlow` while the player is on turn. */
export function SeatAvatar({ name, active, size, avatarId, avatar, danger = false }: SeatAvatarProps) {
    return (
        <View style={{ padding: 3 }}>
            {active ? <TurnGlow key={danger ? 'danger' : 'turn'} size={size + 6} danger={danger} /> : danger ? <DangerHalo size={size + 6} /> : null}
            <View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 2,
                    borderColor: active ? (danger ? '#ea580c' : '#16a34a') : danger ? '#ef4444' : '#ffffff', // orange-600 / green-600 / red-500 / white
                }}
                className="items-center justify-center overflow-hidden"
            >
                {avatar ?? <Avatar username={name} avatar={avatarId} size={size - 4} />}
            </View>
        </View>
    );
}

type SeatProps = {
    name: string;
    opponent: Opponent;
    position: SeatPosition;
    layout: TableLayout;
    /** The player's chosen avatar id; null / missing: the one generated from the name. */
    avatarId?: string | null;
    /** A picture to show instead of the avatar (e.g. in tests). */
    avatar?: ReactNode;
    /** Top seats: avatar and name beside the cards instead of above them (short windows). */
    compact?: boolean;
    /** Swap phase: whether the player is done swapping (a tick before the name); undefined after it. */
    ready?: boolean;
    /** Turn timer: seconds left while the player is on turn (a countdown by the name); null: not timed. */
    secondsLeft?: number | null;
};

/** Cards of a seat, by where it is. */
const SIZES: Record<'top' | 'side' | 'sidePortrait', { stacks: CardSize; fit: number }> = {
    top: { stacks: 'xs', fit: 10 },
    side: { stacks: 'xs', fit: 8 },
    sidePortrait: { stacks: 'xxs', fit: 8 },
};

/**
 * An opponent's seat at the table: avatar (green glow while on turn), name, their hand as
 * a fan of card backs ("×N" only when it is too long to fit), and their table stacks.
 * Left and right seats turn their cards toward the centre, as if the player sat there;
 * text stays upright. Seats have no background: they sit directly on the table.
 */
export function Seat({ name, opponent, position, layout, avatarId, avatar, compact = false, ready, secondsLeft }: SeatProps) {
    const { labelStyle } = useTableTheme();
    const side = position === 'left' || position === 'right';
    const sizes = SIZES[side ? (layout === 'portrait' ? 'sidePortrait' : 'side') : 'top'];
    const spots = tableSpots(opponent.tableFlipped, opponent.table, opponent.spots);
    const { width: cardWidth, height: cardHeight } = useCardSize(sizes.stacks);
    const stacksWidth = useTableStacksWidth(sizes.stacks, spots.length);
    const stacksHeight = cardHeight + stackOffset(cardWidth);
    const rotate = position === 'left' ? 90 : position === 'right' ? -90 : 0;
    const active = !!opponent.active;
    const danger = isCloseToWinning(opponent.hand + opponent.tableFlipped.length + opponent.table);
    const avatarSize = Math.max(24, Math.round(cardWidth * 0.8));
    // Side seats get a fixed width (their text is truncated in it): the turned cards plus a margin.
    const sideWidth = Math.max(56, stacksHeight + 16);

    const summary =
        i18n.t('game.seat.summary', {
            name: [
                name,
                ...(active ? [i18n.t('game.seat.onTurn')] : []),
                ...(ready ? [i18n.t('game.seat.ready')] : []),
                ...(danger ? [i18n.t('game.seat.closeToWinning')] : []),
            ].join(', '),
            hand: opponent.hand,
            faceUp: opponent.tableFlipped.length,
            faceDown: opponent.table,
        });
    const nameText = (
        <Text
            accessibilityLabel={summary}
            numberOfLines={1}
            className={`text-xs font-semibold ${active ? 'text-green-800' : 'text-gray-900'}`}
            style={[{ maxWidth: side ? sideWidth : 120 }, labelStyle]}
        >
            {ready ? <Text style={{ color: '#16a34a', fontWeight: '800' }}>✓ </Text> : null}
            {name}
        </Text>
    );
    const countdown = active && secondsLeft != null ? <TurnCountdown seconds={secondsLeft} /> : null;
    const avatarView = <SeatAvatar name={name} active={active} size={avatarSize} avatarId={avatarId} avatar={avatar} danger={danger} />;
    const fan = <HandFan count={opponent.hand} fit={sizes.fit} rotate={rotate} />;
    const stacks =
        spots.length > 0 ? (
            <Rotated degrees={rotate} width={stacksWidth} height={stacksHeight}>
                <TableStacks faceUp={opponent.tableFlipped} faceDownCount={opponent.table} spots={spots} size={sizes.stacks} />
            </Rotated>
        ) : null;

    if (!side && compact) {
        // One row: avatar over the name, then the hand and the stacks.
        return (
            <View className="flex-row items-center gap-2">
                <View className="items-center gap-0.5">
                    {avatarView}
                    {nameText}
                    {countdown}
                </View>
                {fan}
                {stacks}
            </View>
        );
    }
    if (!side) {
        // Top seats: avatar and name, then the hand and the stacks (side by side when alone
        // at the top, one above the other in the narrower top-left / top-right seats).
        return (
            <View className="items-center gap-1">
                <View className="flex-row items-center gap-1.5">
                    {avatarView}
                    {nameText}
                    {countdown}
                </View>
                <View className={`items-center gap-2 ${position === 'top' ? 'flex-row' : ''}`}>
                    {fan}
                    {stacks}
                </View>
            </View>
        );
    }

    const header = (
        <View className="items-center gap-0.5" style={{ width: sideWidth }}>
            {avatarView}
            {nameText}
            {countdown}
        </View>
    );
    if (layout === 'portrait') {
        // Narrow column at the screen edge.
        return (
            <View className="items-center gap-1.5" style={{ width: sideWidth }}>
                {header}
                {fan}
                {stacks}
            </View>
        );
    }
    // Wide: a row, the stacks nearest the centre.
    return (
        <View className={`items-center gap-2 ${position === 'left' ? 'flex-row' : 'flex-row-reverse'}`}>
            {header}
            {fan}
            {stacks}
        </View>
    );
}

export default Seat;

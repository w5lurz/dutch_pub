import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { Opponent } from '@dutch-pub/shared';

import { Avatar } from '@/components/ui';

import { useCardSize, type CardSize, type TableLayout } from './cardSize';
import { HandFan } from './HandFan';
import { Rotated } from './Rotated';
import type { SeatPosition } from './seats';
import { stackOffset, TableStacks, tableSpots, useTableStacksWidth } from './TableStacks';
import { useTableTheme } from './tableTheme';

type SeatAvatarProps = {
    name: string;
    active: boolean;
    /** Diameter in dp. */
    size: number;
    /** The player's chosen avatar id; null / missing: the one generated from the name. */
    avatarId?: string | null;
    /** A picture to show instead of the avatar (e.g. in tests). */
    avatar?: ReactNode;
};

/**
 * A player's avatar (chosen, or generated from the name: `Avatar`), with a green glow
 * around it while the player is on turn. (Only colours toggle: NativeWind must not get
 * `shadow-*` / `ring-*` classes added later, see AGENTS.md.)
 */
export function SeatAvatar({ name, active, size, avatarId, avatar }: SeatAvatarProps) {
    return (
        <View style={{ padding: 3 }} className={`rounded-full ${active ? 'bg-green-400/70' : 'bg-transparent'}`}>
            <View
                style={{ width: size, height: size }}
                className={`items-center justify-center overflow-hidden rounded-full border-2 ${active ? 'border-green-600' : 'border-white'}`}
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
export function Seat({ name, opponent, position, layout, avatarId, avatar, compact = false }: SeatProps) {
    const { labelStyle } = useTableTheme();
    const side = position === 'left' || position === 'right';
    const sizes = SIZES[side ? (layout === 'portrait' ? 'sidePortrait' : 'side') : 'top'];
    const spots = tableSpots(opponent.tableFlipped, opponent.table);
    const { width: cardWidth, height: cardHeight } = useCardSize(sizes.stacks);
    const stacksWidth = useTableStacksWidth(sizes.stacks, spots.length);
    const stacksHeight = cardHeight + stackOffset(cardWidth);
    const rotate = position === 'left' ? 90 : position === 'right' ? -90 : 0;
    const active = !!opponent.active;
    const avatarSize = Math.max(24, Math.round(cardWidth * 0.8));
    // Side seats get a fixed width (their text is truncated in it): the turned cards plus a margin.
    const sideWidth = Math.max(56, stacksHeight + 16);

    const summary =
        `${name}${active ? ', on turn' : ''}: ${opponent.hand} in hand, ` +
        `${opponent.tableFlipped.length} face-up, ${opponent.table} face-down`;
    const nameText = (
        <Text
            accessibilityLabel={summary}
            numberOfLines={1}
            className={`text-xs font-semibold ${active ? 'text-green-800' : 'text-gray-900'}`}
            style={[{ maxWidth: side ? sideWidth : 120 }, labelStyle]}
        >
            {name}
        </Text>
    );
    const avatarView = <SeatAvatar name={name} active={active} size={avatarSize} avatarId={avatarId} avatar={avatar} />;
    const fan = <HandFan count={opponent.hand} fit={sizes.fit} rotate={rotate} />;
    const stacks =
        spots.length > 0 ? (
            <Rotated degrees={rotate} width={stacksWidth} height={stacksHeight}>
                <TableStacks faceUp={opponent.tableFlipped} faceDownCount={opponent.table} size={sizes.stacks} />
            </Rotated>
        ) : null;

    if (!side && compact) {
        // One row: avatar over the name, then the hand and the stacks.
        return (
            <View className="flex-row items-center gap-2">
                <View className="items-center gap-0.5">
                    {avatarView}
                    {nameText}
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

import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { normalizeRoomSettings, type TRoom } from '@dutch-pub/shared';

import { Avatar, Button } from '@/components/ui';
import { isPrivate, type RoomPermissions } from '@/hooks/useRooms';
import { describeRoomSettings } from './RoomSettingsFields';

export type RoomCardProps = {
    room: TRoom;
    /** The room the signed-in user is in. */
    isCurrent: boolean;
    permissions: RoomPermissions;
    /** Disables every action (e.g. while the socket is disconnected). */
    disabled?: boolean;
    onJoin: () => void;
    onLeave: () => void;
    onDelete: () => void;
    onStart: () => void;
    /** Opens the room settings sheet (editable for the owner, read-only for everyone else). */
    onSettings: () => void;
    /** The owner fills a free seat with a bot / removes one (only offered before the game). */
    onAddBot?: () => void;
    onRemoveBot?: (username: string) => void;
};

function Badge({ label, className }: { label: string; className: string }) {
    return (
        <View className={`rounded-full px-2 py-0.5 ${className}`}>
            <Text className="text-xs font-semibold text-gray-800">{label}</Text>
        </View>
    );
}

/** An empty seat: a dashed circle where a player's chip would be. */
function FreeSeat() {
    return <View className="h-7 w-7 rounded-full border-2 border-dashed border-gray-300" />;
}

/**
 * One room in the lobby: its name, the players (the owner with a crown) and the free seats,
 * the settings (tap to see them all, read-only unless you own the room), what you are
 * waiting for when you are in it, and the actions allowed for you (Join as the main one).
 */
export function RoomCard({ room, isCurrent, permissions, disabled = false, onJoin, onLeave, onDelete, onStart, onSettings, onAddBot, onRemoveBot }: RoomCardProps) {
    const { t } = useTranslation();
    const { name, owner, players, slots, inGame = false, visibility = 'private' } = room;
    const { canJoin, canLeave, canDelete, canStart, canEditSettings } = permissions;
    const isOwner = canDelete;
    const settingsSummary = describeRoomSettings(normalizeRoomSettings(room.settings));
    const privateRoom = isPrivate(visibility);
    const freeSeats = Math.max(0, slots - players.length);
    // Bots: the owner's choice, before the game, on free seats.
    const canManageBots = isOwner && !inGame && !!onAddBot;
    const waiting = isCurrent && !inGame ? (isOwner ? t(players.length > 1 ? 'rooms.card.waitingOwner' : 'rooms.card.waitingPlayers') : t('rooms.card.waiting', { owner })) : null;

    return (
        <View
            accessibilityLabel={[
                t('rooms.card.summary', { name, owner, count: players.length, slots }),
                t(privateRoom ? 'rooms.card.private' : 'rooms.card.public'),
                ...(inGame ? [t('rooms.card.inGame')] : []),
                ...(isCurrent ? [t('rooms.card.yourRoom')] : []),
            ].join(', ')}
            className={`gap-2.5 rounded-lg border-2 bg-white p-4 shadow-sm ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${
                inGame ? 'opacity-70' : ''
            }`}
        >
            <View className="flex-row flex-wrap items-center gap-2">
                <Text numberOfLines={2} className="flex-shrink text-xl font-semibold text-gray-900">
                    {name}
                </Text>
                <Badge label={t(privateRoom ? 'roomSettings.private' : 'roomSettings.public')} className={privateRoom ? 'bg-gray-200' : 'bg-green-200'} />
                {inGame ? <Badge label={t('rooms.card.inGameBadge')} className="bg-yellow-200" /> : null}
                {isCurrent ? <Badge label={t('rooms.card.yourRoomBadge')} className="bg-blue-200" /> : null}
            </View>
            <View className="gap-1">
                <Text className="text-sm text-gray-700">{t('rooms.card.players', { count: players.length, slots })}</Text>
                <View className="flex-row flex-wrap items-center gap-2">
                    {players.map(player => (
                        <View key={player.username} className="flex-row items-center gap-1 rounded-full bg-gray-100 py-0.5 pl-0.5 pr-2">
                            <Avatar username={player.username} avatar={player.avatar} size={24} />
                            <Text numberOfLines={1} className="max-w-28 text-xs text-gray-800">
                                {player.username}
                            </Text>
                            {player.username === owner ? (
                                <Text accessibilityLabel={t('rooms.card.ownerLabel')} className="text-xs">
                                    👑
                                </Text>
                            ) : null}
                            {player.bot && canManageBots && onRemoveBot ? (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={t('rooms.card.removeBot', { name: player.username })}
                                    onPress={() => onRemoveBot(player.username)}
                                    disabled={disabled}
                                    hitSlop={8}
                                    className="ml-0.5 active:opacity-60"
                                >
                                    <Text className="text-sm font-bold text-gray-500">×</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    ))}
                    {Array.from({ length: freeSeats }, (_, i) => (
                        <FreeSeat key={`free-${i}`} />
                    ))}
                </View>
            </View>
            {/* Anyone may look at the settings before joining (read-only unless it's your room). */}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(canEditSettings ? 'rooms.card.changeSettingsLabel' : 'rooms.card.viewSettingsLabel', { name })}
                onPress={onSettings}
                hitSlop={4}
                className="flex-row items-center gap-1 active:opacity-60"
            >
                <Text numberOfLines={1} className="flex-1 text-sm text-gray-700">
                    {t('rooms.card.settings', { summary: settingsSummary })}
                </Text>
                <Text className="text-base text-gray-500">›</Text>
            </Pressable>
            {canManageBots && freeSeats > 0 ? (
                <Button
                    label={t('rooms.card.addBot')}
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onPress={() => onAddBot?.()}
                    className="self-start"
                    testID="add-bot"
                />
            ) : null}
            {waiting ? (
                <Text accessibilityLiveRegion="polite" className="text-sm font-medium text-blue-700">
                    {waiting}
                </Text>
            ) : null}
            {canJoin ? (
                <Button
                    label={t('rooms.card.join')}
                    variant="green"
                    disabled={disabled}
                    onPress={onJoin}
                    accessibilityLabel={t('rooms.card.joinLabel', { name })}
                    className="w-full"
                />
            ) : null}
            {canLeave || canDelete || canStart ? (
                <View className="flex-row flex-wrap gap-2 pt-1">
                    {canStart ? (
                        <Button
                            label={t('rooms.card.start')}
                            variant="green"
                            disabled={disabled}
                            onPress={onStart}
                            accessibilityLabel={t('rooms.card.startLabel', { name })}
                            className="flex-1"
                        />
                    ) : null}
                    {canEditSettings ? (
                        <Button label={t('rooms.card.settingsButton')} variant="outline" size="sm" onPress={onSettings} />
                    ) : null}
                    {canLeave ? (
                        <Button
                            label={t('rooms.card.leave')}
                            variant="yellow"
                            size="sm"
                            disabled={disabled}
                            onPress={onLeave}
                            accessibilityLabel={t('rooms.card.leaveLabel', { name })}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            label={t('rooms.card.delete')}
                            variant="red"
                            size="sm"
                            disabled={disabled}
                            onPress={onDelete}
                            accessibilityLabel={t('rooms.card.deleteLabel', { name })}
                        />
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

export default RoomCard;

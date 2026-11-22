import { Text, View } from 'react-native';
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
    /** Opens the room settings sheet (editable for the owner, read-only for the others). */
    onSettings: () => void;
};

function Badge({ label, className }: { label: string; className: string }) {
    return (
        <View className={`rounded-full px-2 py-0.5 ${className}`}>
            <Text className="text-xs font-semibold text-gray-800">{label}</Text>
        </View>
    );
}

/** One room in the lobby list: name, owner, players and the actions allowed for the user. */
export function RoomCard({ room, isCurrent, permissions, disabled = false, onJoin, onLeave, onDelete, onStart, onSettings }: RoomCardProps) {
    const { t } = useTranslation();
    const { name, owner, players, slots, inGame = false, visibility = 'private' } = room;
    const { canJoin, canLeave, canDelete, canStart, canViewSettings, canEditSettings } = permissions;
    const hasActions = canJoin || canLeave || canDelete || canStart || canViewSettings;
    const settingsSummary = describeRoomSettings(normalizeRoomSettings(room.settings));
    const privateRoom = isPrivate(visibility);

    return (
        <View
            accessibilityLabel={[
                t('rooms.card.summary', { name, owner, count: players.length, slots }),
                t(privateRoom ? 'rooms.card.private' : 'rooms.card.public'),
                ...(inGame ? [t('rooms.card.inGame')] : []),
                ...(isCurrent ? [t('rooms.card.yourRoom')] : []),
            ].join(', ')}
            className={`gap-2 rounded-lg border-2 bg-white p-4 shadow-sm ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${
                inGame ? 'opacity-70' : ''
            }`}
        >
            <View className="flex-row flex-wrap items-center gap-2">
                <Text numberOfLines={1} className="flex-shrink text-xl text-gray-900">
                    {t('rooms.card.name', { name })}
                </Text>
                <Badge label={t(privateRoom ? 'roomSettings.private' : 'roomSettings.public')} className={privateRoom ? 'bg-gray-200' : 'bg-green-200'} />
                {inGame ? <Badge label={t('rooms.card.inGameBadge')} className="bg-yellow-200" /> : null}
                {isCurrent ? <Badge label={t('rooms.card.yourRoomBadge')} className="bg-blue-200" /> : null}
            </View>
            <Text numberOfLines={1} className="text-sm text-gray-700">
                {t('rooms.card.owner', { owner })}
            </Text>
            <View className="gap-1">
                <Text className="text-base text-gray-900">
                    {players.length === 0 ? t('rooms.card.playersNone', { count: players.length, slots }) : t('rooms.card.players', { count: players.length, slots })}
                </Text>
                {players.length > 0 ? (
                    <View className="flex-row flex-wrap gap-2">
                        {players.map(player => (
                            <View key={player.username} className="flex-row items-center gap-1 rounded-full bg-gray-100 py-0.5 pl-0.5 pr-2">
                                <Avatar username={player.username} avatar={player.avatar} size={24} />
                                <Text numberOfLines={1} className="max-w-28 text-xs text-gray-800">
                                    {player.username}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </View>
            <Text numberOfLines={1} className="text-sm text-gray-700">
                {t('rooms.card.settings', { summary: settingsSummary })}
            </Text>
            {hasActions ? (
                <View className="flex-row flex-wrap gap-2 pt-1">
                    {canJoin ? (
                        <Button label={t('rooms.card.join')} variant="green" size="sm" disabled={disabled} onPress={onJoin} accessibilityLabel={t('rooms.card.joinLabel', { name })} />
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
                    {canViewSettings ? (
                        <Button
                            label={t('rooms.card.settingsButton')}
                            variant="gray"
                            size="sm"
                            onPress={onSettings}
                            accessibilityLabel={t(canEditSettings ? 'rooms.card.changeSettingsLabel' : 'rooms.card.viewSettingsLabel', { name })}
                        />
                    ) : null}
                    {canStart ? (
                        <Button
                            label={t('rooms.card.start')}
                            variant="blue"
                            size="sm"
                            disabled={disabled}
                            onPress={onStart}
                            accessibilityLabel={t('rooms.card.startLabel', { name })}
                        />
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

export default RoomCard;

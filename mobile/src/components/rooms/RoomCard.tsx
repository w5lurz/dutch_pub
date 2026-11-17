import { Text, View } from 'react-native';
import { normalizeRoomSettings, type TRoom } from '@dutch-pub/shared';

import { Button } from '@/components/ui';
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
    const { name, owner, players, slots, inGame = false, visibility = 'private' } = room;
    const { canJoin, canLeave, canDelete, canStart, canViewSettings, canEditSettings } = permissions;
    const hasActions = canJoin || canLeave || canDelete || canStart || canViewSettings;
    const settingsSummary = describeRoomSettings(normalizeRoomSettings(room.settings));
    const privateRoom = isPrivate(visibility);

    return (
        <View
            accessibilityLabel={`Room ${name}, owner ${owner}, ${players.length} of ${slots} players${privateRoom ? ', private' : ', public'}${
                inGame ? ', in game' : ''
            }${isCurrent ? ', your room' : ''}`}
            className={`gap-2 rounded-lg border-2 bg-white p-4 shadow-sm ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${
                inGame ? 'opacity-70' : ''
            }`}
        >
            <View className="flex-row flex-wrap items-center gap-2">
                <Text numberOfLines={1} className="flex-shrink text-xl text-gray-900">
                    Room name: {name}
                </Text>
                <Badge label={privateRoom ? 'Private' : 'Public'} className={privateRoom ? 'bg-gray-200' : 'bg-green-200'} />
                {inGame ? <Badge label="In game" className="bg-yellow-200" /> : null}
                {isCurrent ? <Badge label="Your room" className="bg-blue-200" /> : null}
            </View>
            <Text numberOfLines={1} className="text-sm text-gray-700">
                Owner: {owner}
            </Text>
            <Text numberOfLines={2} className="text-base text-gray-900">
                Players: {players.map(player => player.username).join(', ')} ({players.length}/{slots})
            </Text>
            <Text numberOfLines={1} className="text-sm text-gray-700">
                Settings: {settingsSummary}
            </Text>
            {hasActions ? (
                <View className="flex-row flex-wrap gap-2 pt-1">
                    {canJoin ? (
                        <Button label="Join" variant="green" size="sm" disabled={disabled} onPress={onJoin} accessibilityLabel={`Join room ${name}`} />
                    ) : null}
                    {canLeave ? (
                        <Button
                            label="Leave"
                            variant="yellow"
                            size="sm"
                            disabled={disabled}
                            onPress={onLeave}
                            accessibilityLabel={`Leave room ${name}`}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            label="Delete"
                            variant="red"
                            size="sm"
                            disabled={disabled}
                            onPress={onDelete}
                            accessibilityLabel={`Delete room ${name}`}
                        />
                    ) : null}
                    {canViewSettings ? (
                        <Button
                            label="Settings"
                            variant="gray"
                            size="sm"
                            onPress={onSettings}
                            accessibilityLabel={`${canEditSettings ? 'Change' : 'View'} settings of room ${name}`}
                        />
                    ) : null}
                    {canStart ? (
                        <Button
                            label="Start"
                            variant="blue"
                            size="sm"
                            disabled={disabled}
                            onPress={onStart}
                            accessibilityLabel={`Start game in room ${name}`}
                        />
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

export default RoomCard;

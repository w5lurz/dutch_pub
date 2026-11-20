import { View } from 'react-native';
import type { RoomSettings } from '@dutch-pub/shared';

import { ChoiceRow, SettingRow, type SegmentedOption } from '@/components/ui';
import type { RoomVisibility } from '@/hooks/useRooms';

type SettingKey = keyof RoomSettings;
type BooleanSettingKey = { [K in SettingKey]: RoomSettings[K] extends boolean ? K : never }[SettingKey];
type ChoiceSettingKey = { [K in SettingKey]: RoomSettings[K] extends string | number ? K : never }[SettingKey];

type SwitchField = { kind: 'switch'; key: BooleanSettingKey; label: string; description: string };
type ChoiceField<K extends ChoiceSettingKey = ChoiceSettingKey> = {
    kind: 'choice';
    key: K;
    label: string;
    description: string;
    options: readonly SegmentedOption<RoomSettings[K]>[];
};
export type RoomSettingField = SwitchField | ChoiceField;

/** The card back colours as shown in the swatches (the red and blue of the card back art). */
const CARD_BACK_OPTIONS: ChoiceField<'cardBack'>['options'] = [
    { value: 'red', label: 'Red', swatch: '#b91c1c' },
    { value: 'blue', label: 'Blue', swatch: '#1d4ed8' },
];

/** Who can join a room: guests can't join private rooms. */
export const VISIBILITY_OPTIONS: readonly SegmentedOption<RoomVisibility>[] = [
    { label: 'Private', value: 'private' },
    { label: 'Public', value: 'public' },
];

/** Seconds per turn before it is skipped (0: no timer). */
const TURN_TIMER_OPTIONS: ChoiceField<'turnTimer'>['options'] = [
    { value: 0, label: 'Off' },
    { value: 15, label: '15s' },
    { value: 30, label: '30s' },
    { value: 60, label: '1m' },
];

/** Decks in the game (0: auto, 2 decks with 4 players). */
const DECK_OPTIONS: ChoiceField<'decks'>['options'] = [
    { value: 0, label: 'Auto' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
];

/** Every room setting with its copy. A new setting is one line here (a switch, or a choice of a few options). */
export const ROOM_SETTING_FIELDS: readonly RoomSettingField[] = [
    { kind: 'switch', key: 'showCardPowers', label: 'Show card powers', description: 'Special cards show what they do (e.g. CLEAR ALL)' },
    { kind: 'choice', key: 'cardBack', label: 'Card backs', description: 'Colour of the backs of the cards', options: CARD_BACK_OPTIONS },
    {
        kind: 'choice',
        key: 'turnTimer',
        label: 'Turn timer',
        description: 'Time to lay a card; when it runs out the turn is skipped',
        options: TURN_TIMER_OPTIONS,
    },
    { kind: 'switch', key: 'nineOnMagic', label: '9 on a magic card', description: 'A 9 ("You lose") may be laid on a magic card' },
    { kind: 'switch', key: 'sixReverses', label: '6 reverses', description: 'A 6 reverses the turn order' },
    { kind: 'choice', key: 'decks', label: 'Decks', description: 'Auto: 2 decks with 4 players, else 1', options: DECK_OPTIONS },
];

export type RoomSettingsFieldsProps = {
    value: RoomSettings;
    /** Called with the one setting that changed. */
    onChange: (change: Partial<RoomSettings>) => void;
    /** Read-only (for players who don't own the room, or once the game started). */
    disabled?: boolean;
};

/** The room settings as a list of switches and choices (create-room modal, room settings sheet). */
export function RoomSettingsFields({ value, onChange, disabled = false }: RoomSettingsFieldsProps) {
    return (
        <View className="gap-1">
            {ROOM_SETTING_FIELDS.map(field =>
                field.kind === 'switch' ? (
                    <SettingRow
                        key={field.key}
                        label={field.label}
                        description={field.description}
                        value={value[field.key]}
                        onValueChange={next => onChange({ [field.key]: next })}
                        disabled={disabled}
                    />
                ) : (
                    <ChoiceRow
                        key={field.key}
                        label={field.label}
                        description={field.description}
                        options={field.options}
                        value={value[field.key]}
                        onChange={next => onChange({ [field.key]: next })}
                        disabled={disabled}
                    />
                ),
            )}
        </View>
    );
}

const optionLabel = (key: ChoiceSettingKey, value: string | number) => {
    const field = ROOM_SETTING_FIELDS.find(candidate => candidate.key === key);
    return (field?.kind === 'choice' && field.options.find(option => option.value === value)?.label) || String(value);
};

/** Short read-only summary, e.g. "Card powers shown · Red backs · 30s turns". */
export const describeRoomSettings = (settings: RoomSettings) =>
    [
        settings.showCardPowers ? 'Card powers shown' : 'Card powers hidden',
        `${optionLabel('cardBack', settings.cardBack)} backs`,
        settings.turnTimer > 0 ? `${optionLabel('turnTimer', settings.turnTimer)} turns` : 'No turn timer',
        // House rules only when they differ from the base game.
        ...(settings.nineOnMagic ? [] : ['No 9 on magic']),
        ...(settings.sixReverses ? ['6 reverses'] : []),
        ...(settings.decks ? [`${settings.decks} deck${settings.decks > 1 ? 's' : ''}`] : []),
    ].join(' · ');

export default RoomSettingsFields;

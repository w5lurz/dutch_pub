import { View } from 'react-native';
import type { RoomSettings } from '@dutch-pub/shared';

import { ChoiceRow, SettingRow, type SegmentedOption } from '@/components/ui';

type SettingKey = keyof RoomSettings;
type BooleanSettingKey = { [K in SettingKey]: RoomSettings[K] extends boolean ? K : never }[SettingKey];
type ChoiceSettingKey = { [K in SettingKey]: RoomSettings[K] extends string ? K : never }[SettingKey];

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

/** Every room setting with its copy. A new setting is one line here (a switch, or a choice of a few options). */
export const ROOM_SETTING_FIELDS: readonly RoomSettingField[] = [
    { kind: 'switch', key: 'showCardPowers', label: 'Show card powers', description: 'Special cards show what they do (e.g. CLEAR ALL)' },
    { kind: 'choice', key: 'cardBack', label: 'Card backs', description: 'Colour of the backs of the cards', options: CARD_BACK_OPTIONS },
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

const optionLabel = (key: ChoiceSettingKey, value: string) => {
    const field = ROOM_SETTING_FIELDS.find(candidate => candidate.key === key);
    return (field?.kind === 'choice' && field.options.find(option => option.value === value)?.label) || value;
};

/** Short read-only summary, e.g. "Card powers shown · Red backs". */
export const describeRoomSettings = (settings: RoomSettings) =>
    [settings.showCardPowers ? 'Card powers shown' : 'Card powers hidden', `${optionLabel('cardBack', settings.cardBack)} backs`].join(' · ');

export default RoomSettingsFields;

import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoomSettings } from '@dutch-pub/shared';

import { ChoiceRow, SettingRow, type SegmentedOption } from '@/components/ui';
import type { RoomVisibility } from '@/hooks/useRooms';
import i18n from '@/i18n';
import type en from '@/i18n/locales/en';

type SettingKey = keyof RoomSettings;
type BooleanSettingKey = { [K in SettingKey]: RoomSettings[K] extends boolean ? K : never }[SettingKey];
type ChoiceSettingKey = { [K in SettingKey]: RoomSettings[K] extends string | number ? K : never }[SettingKey];

/** A text of the room settings (`roomSettings.*` in src/i18n/locales). */
type TextKey = keyof (typeof en)['roomSettings'];
/** An option with the key of its label instead of the label (translated when shown). */
type Option<T extends string | number> = Omit<SegmentedOption<T>, 'label'> & { label: TextKey };

type SwitchField = { kind: 'switch'; key: BooleanSettingKey; label: TextKey; description: TextKey };
type ChoiceField<K extends ChoiceSettingKey = ChoiceSettingKey> = {
    kind: 'choice';
    key: K;
    label: TextKey;
    description: TextKey;
    options: readonly Option<RoomSettings[K]>[];
};
export type RoomSettingField = SwitchField | ChoiceField;

const text = (key: TextKey) => i18n.t(`roomSettings.${key}`);
const translated = <T extends string | number>(options: readonly Option<T>[]): SegmentedOption<T>[] => options.map(option => ({ ...option, label: text(option.label) }));

/** The card back colours as shown in the swatches (the red and blue of the card back art). */
const CARD_BACK_OPTIONS: ChoiceField<'cardBack'>['options'] = [
    { value: 'red', label: 'red', swatch: '#b91c1c' },
    { value: 'blue', label: 'blue', swatch: '#1d4ed8' },
];

/** Who can join a room: guests can't join private rooms. */
const VISIBILITY_OPTIONS: readonly Option<RoomVisibility>[] = [
    { label: 'private', value: 'private' },
    { label: 'public', value: 'public' },
];

/** The visibility choices in the app's language. */
export function useVisibilityOptions(): SegmentedOption<RoomVisibility>[] {
    useTranslation();
    return translated(VISIBILITY_OPTIONS);
}

/** Seconds per turn before it is skipped (0: no timer). */
const TURN_TIMER_OPTIONS: ChoiceField<'turnTimer'>['options'] = [
    { value: 0, label: 'off' },
    { value: 15, label: 'seconds15' },
    { value: 30, label: 'seconds30' },
    { value: 60, label: 'minute1' },
];

/** Decks in the game (0: auto, 2 decks with 4 players). */
const DECK_OPTIONS: ChoiceField<'decks'>['options'] = [
    { value: 0, label: 'auto' },
    { value: 1, label: 'one' },
    { value: 2, label: 'two' },
];

/** Every room setting with its copy. A new setting is one line here (a switch, or a choice of a few options). */
export const ROOM_SETTING_FIELDS: readonly RoomSettingField[] = [
    { kind: 'switch', key: 'showCardPowers', label: 'showCardPowers', description: 'showCardPowersDescription' },
    { kind: 'choice', key: 'cardBack', label: 'cardBacks', description: 'cardBacksDescription', options: CARD_BACK_OPTIONS },
    { kind: 'choice', key: 'turnTimer', label: 'turnTimer', description: 'turnTimerDescription', options: TURN_TIMER_OPTIONS },
    { kind: 'switch', key: 'nineOnMagic', label: 'nineOnMagic', description: 'nineOnMagicDescription' },
    { kind: 'switch', key: 'sixReverses', label: 'sixReverses', description: 'sixReversesDescription' },
    { kind: 'choice', key: 'decks', label: 'decks', description: 'decksDescription', options: DECK_OPTIONS },
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
    useTranslation(); // re-renders when the language changes
    return (
        <View className="gap-1">
            {ROOM_SETTING_FIELDS.map(field =>
                field.kind === 'switch' ? (
                    <SettingRow
                        key={field.key}
                        label={text(field.label)}
                        description={text(field.description)}
                        value={value[field.key]}
                        onValueChange={next => onChange({ [field.key]: next })}
                        disabled={disabled}
                    />
                ) : (
                    <ChoiceRow
                        key={field.key}
                        label={text(field.label)}
                        description={text(field.description)}
                        options={translated<string | number>(field.options)}
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
    const option = field?.kind === 'choice' ? field.options.find(candidate => candidate.value === value) : undefined;
    return option ? text(option.label) : String(value);
};

/** Short read-only summary, e.g. "Card powers shown · Red backs · 30s turns". */
export const describeRoomSettings = (settings: RoomSettings) =>
    [
        text(settings.showCardPowers ? 'summaryPowersShown' : 'summaryPowersHidden'),
        i18n.t('roomSettings.summaryBacks', { colour: optionLabel('cardBack', settings.cardBack) }),
        settings.turnTimer > 0 ? i18n.t('roomSettings.summaryTurns', { time: optionLabel('turnTimer', settings.turnTimer) }) : text('summaryNoTimer'),
        // House rules only when they differ from the base game.
        ...(settings.nineOnMagic ? [] : [text('summaryNoNineOnMagic')]),
        ...(settings.sixReverses ? [text('sixReverses')] : []),
        ...(settings.decks ? [i18n.t('roomSettings.summaryDecks', { count: settings.decks })] : []),
    ].join(' · ');

export default RoomSettingsFields;

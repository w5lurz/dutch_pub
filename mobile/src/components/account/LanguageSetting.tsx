import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui';
import { LANGUAGES, phoneLanguage, setLanguageChoice, useLanguageChoice, type LanguageChoice } from '@/i18n';

const languageName = (code: string) => LANGUAGES.find(language => language.code === code)?.name ?? code;

/**
 * "Language" on the Account tab (this phone only): the phone's language or one of the app's,
 * picked from a sheet. Each language is named in itself, so it can be found whatever is shown.
 */
export function LanguageSetting() {
    const { t } = useTranslation();
    const choice = useLanguageChoice();
    const [open, setOpen] = useState(false);
    const current = choice === 'auto' ? t('language.phone', { language: languageName(phoneLanguage()) }) : languageName(choice);

    const options: { value: LanguageChoice; label: string }[] = [
        { value: 'auto', label: t('language.phone', { language: languageName(phoneLanguage()) }) },
        ...LANGUAGES.map(language => ({ value: language.code, label: language.name })),
    ];

    const pick = (value: LanguageChoice) => {
        setLanguageChoice(value);
        setOpen(false);
    };

    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('language.title')}: ${current}`}
                accessibilityHint={t('language.hint')}
                onPress={() => setOpen(true)}
                testID="language-setting"
                className="min-h-12 flex-row items-center gap-3 py-1 active:opacity-70"
            >
                <View className="flex-1 gap-0.5">
                    <Text className="text-base font-medium text-gray-900">{t('language.title')}</Text>
                    <Text className="text-sm text-gray-700">{current}</Text>
                </View>
                <Text className="text-xl text-gray-500" accessibilityElementsHidden importantForAccessibility="no">
                    ›
                </Text>
            </Pressable>
            <BottomSheet visible={open} title={t('language.title')} onClose={() => setOpen(false)}>
                <View accessibilityRole="radiogroup" className="gap-2">
                    {options.map(option => {
                        const selected = option.value === choice;
                        return (
                            <Pressable
                                key={option.value}
                                accessibilityRole="radio"
                                accessibilityState={{ selected }}
                                onPress={() => pick(option.value)}
                                testID={`language-${option.value}`}
                                className={`rounded-lg border-2 px-4 py-3 active:opacity-70 ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                            >
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-base text-gray-900">{option.label}</Text>
                                    {selected ? <Text className="text-lg font-bold text-blue-600">✓</Text> : null}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </BottomSheet>
        </>
    );
}

export default LanguageSetting;

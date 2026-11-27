import { useSyncExternalStore } from 'react';
// `use` renamed: the hooks lint rule takes any `use...` call for a React hook.
import i18n, { changeLanguage, use as addPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import { getDeviceSetting, setDeviceSetting } from '@/lib/deviceSettings';

import de from './locales/de';
import en from './locales/en';
import fr from './locales/fr';
import hu from './locales/hu';
import uk from './locales/uk';
import zh from './locales/zh';

// The app's texts in every language (`t('account.logOut')`). English is the source and the
// fallback; the app follows the phone's language unless a language is picked on the Account tab
// (remembered on this device). Messages from the server stay English on the wire and are
// translated in the app when known (`serverMessage`), so old apps and the server never disagree.

/** The languages, each named in itself (shown like that in the picker). */
export const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hu', name: 'Magyar' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'uk', name: 'Українська' },
    { code: 'zh', name: '中文' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];
/** What the user picked: a language, or `auto` (the phone's). */
export type LanguageChoice = Language | 'auto';

const isLanguage = (code: string | null | undefined): code is Language => LANGUAGES.some(language => language.code === code);

/** The first of the phone's preferred languages that the app has, else English. */
export function phoneLanguage(): Language {
    try {
        for (const locale of getLocales()) {
            if (isLanguage(locale.languageCode)) return locale.languageCode;
        }
    } catch {
        // No locale information (e.g. a test): English.
    }
    return 'en';
}

addPlugin(initReactI18next).init({
    resources: { en: { translation: en }, hu: { translation: hu }, de: { translation: de }, fr: { translation: fr }, uk: { translation: uk }, zh: { translation: zh } },
    lng: phoneLanguage(),
    fallbackLng: 'en',
    // React escapes already.
    interpolation: { escapeValue: false },
    initAsync: false,
    returnNull: false,
});

const SETTING = 'language';
let choice: LanguageChoice = 'auto';
const listeners = new Set<() => void>();

/** On app start: the language picked on this device, if any. */
export async function initLanguage(): Promise<void> {
    const saved = await getDeviceSetting(SETTING);
    choice = isLanguage(saved) ? saved : 'auto';
    await changeLanguage(choice === 'auto' ? phoneLanguage() : choice);
    listeners.forEach(listener => listener());
}

/** Picks the app's language on this device (`auto`: follow the phone). */
export function setLanguageChoice(value: LanguageChoice): void {
    choice = value;
    setDeviceSetting(SETTING, value);
    changeLanguage(value === 'auto' ? phoneLanguage() : value);
    listeners.forEach(listener => listener());
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/** The picked language or `auto` (re-renders when it changes). */
export function useLanguageChoice(): LanguageChoice {
    return useSyncExternalStore(subscribe, () => choice);
}

export { serverMessage } from './serverMessages';
export default i18n;

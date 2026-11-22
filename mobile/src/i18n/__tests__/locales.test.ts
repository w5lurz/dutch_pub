import i18n, { LANGUAGES, serverMessage, setLanguageChoice } from '@/i18n';
import { cardName } from '@/i18n/cards';
import de from '@/i18n/locales/de';
import en from '@/i18n/locales/en';
import fr from '@/i18n/locales/fr';
import hu from '@/i18n/locales/hu';
import uk from '@/i18n/locales/uk';
import zh from '@/i18n/locales/zh';

type Tree = { [key: string]: string | Tree };

/** "a.b.c" -> text, for every text in `tree`. */
const flatten = (tree: Tree, prefix = ''): Record<string, string> =>
    Object.entries(tree).reduce<Record<string, string>>(
        (all, [key, value]) => ({ ...all, ...(typeof value === 'string' ? { [prefix + key]: value } : flatten(value, `${prefix}${key}.`)) }),
        {},
    );

/** The parts a translation must keep: {{placeholders}} and <b> / <n> / <url> markers. */
const markers = (text: string) => [...text.matchAll(/\{\{\w+\}\}|<\/?(?:b|n|url)>/g)].map(match => match[0]).sort();

const english = flatten(en);
const others = { hu, de, fr, uk, zh };

describe('translations', () => {
    it('cover every language in the picker', () => {
        expect(LANGUAGES.map(language => language.code).sort()).toEqual(['de', 'en', 'fr', 'hu', 'uk', 'zh']);
    });

    it.each(Object.entries(others))('%s has exactly the English keys, with the same placeholders', (_, texts) => {
        const translated = flatten(texts as Tree);
        expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
        for (const [key, text] of Object.entries(english)) {
            expect({ key, markers: markers(translated[key]) }).toEqual({ key, markers: markers(text) });
            expect(translated[key].trim()).not.toBe('');
        }
    });
});

describe('switching the language', () => {
    afterEach(() => setLanguageChoice('en'));

    it('changes the texts, server messages, plurals and card names', () => {
        setLanguageChoice('hu');
        expect(i18n.t('tabs.leaderboard')).toBe('Ranglista');
        expect(serverMessage('This room is full.')).toBe('Ez a szoba megtelt.');
        expect(serverMessage('A message has 1 to 256 characters.')).toBe('Egy üzenet 1–256 karakteres lehet.');
        expect(serverMessage('Some brand-new server message.')).toBe('Some brand-new server message.');
        expect(cardName({ name: 'Clear all' })).toBe('Mindent töröl');
        expect(cardName({ name: '7' })).toBe('7');

        setLanguageChoice('uk');
        expect(i18n.t('game.cardsInHand', { count: 1 })).toBe('1 карта в руці');
        expect(i18n.t('game.cardsInHand', { count: 3 })).toBe('3 карти в руці');
        expect(i18n.t('game.cardsInHand', { count: 5 })).toBe('5 карт у руці');

        setLanguageChoice('en');
        expect(i18n.t('game.cardsInHand', { count: 1 })).toBe('1 card in hand');
        expect(serverMessage('Registration Failed! Username is already in use!')).toBe('Registration Failed! Username is already in use!');
    });
});

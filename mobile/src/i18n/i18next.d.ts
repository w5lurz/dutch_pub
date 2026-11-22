// Typed keys: `t('...')` only accepts keys that exist in the English texts.
import 'i18next';

import type en from './locales/en';

declare module 'i18next' {
    interface CustomTypeOptions {
        resources: { translation: typeof en };
        returnNull: false;
    }
}

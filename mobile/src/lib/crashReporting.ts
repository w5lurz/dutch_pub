import * as Sentry from '@sentry/react-native';

// EXPO_PUBLIC_* values are inlined at build time and must be read with dot notation. A Sentry
// DSN is not a secret (it only allows sending events), but it still comes from the
// environment (.env.local / EAS environment variables), never from the code.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Starts crash and error reporting (Sentry): JS errors, native crashes and render crashes
 * (`Sentry.wrap` on the root layout). Only in release builds (the APK) with a DSN set, so
 * development errors never leave the computer. No personal data: no IP address, no user
 * email; only the app version, device model and OS come along with a report.
 */
export function initCrashReporting() {
    if (!DSN || __DEV__) return;
    Sentry.init({
        dsn: DSN,
        sendDefaultPii: false,
        // Errors only: no performance tracing or session replays.
        tracesSampleRate: 0,
        environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? 'beta',
    });
}

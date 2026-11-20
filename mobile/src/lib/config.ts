// EXPO_PUBLIC_* values are inlined at build time and must be read with dot notation.
// Set EXPO_PUBLIC_API_URL in .env.local (see .env.example).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3030';

/** The privacy policy (served by the backend, backend/src/pages.js; or EXPO_PUBLIC_PRIVACY_URL once it lives elsewhere). */
export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? `${API_URL}/privacy`;

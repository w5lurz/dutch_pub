// Test-environment mocks for native modules (see jest.config.js).

// Worklets' own mock: no UI runtime in Jest (Gesture Handler and Reanimated ask for one).
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
require('react-native-gesture-handler/jestSetup');
require('react-native-reanimated').setUpTests();

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    notificationAsync: jest.fn(() => Promise.resolve()),
    selectionAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// No native audio in Jest: players that record what they were asked to play.
jest.mock('expo-audio', () => ({
    createAudioPlayer: jest.fn(() => ({ play: jest.fn(), seekTo: jest.fn(() => Promise.resolve()), remove: jest.fn() })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

// No push service in Jest: permission granted, a fixed token.
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', canAskAgain: true })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', canAskAgain: true })),
    getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ type: 'expo', data: 'ExponentPushToken[test]' })),
    dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
    AndroidImportance: { HIGH: 6 },
}));

// The phone's language in Jest: English (the tests check the English texts).
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en', languageTag: 'en-US' }] }));
// The app loads the translations in its root layout; components tested on their own need them too.
require('./src/i18n');

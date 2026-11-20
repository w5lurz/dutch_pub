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

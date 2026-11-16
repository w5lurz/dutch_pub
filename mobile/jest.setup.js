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

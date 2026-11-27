const expoPreset = require('jest-expo/jest-preset');

/** @type {import('jest').Config} */
module.exports = {
    preset: 'jest-expo',
    // Picks the JS (not native) builds of Reanimated / Worklets in tests.
    resolver: 'react-native-reanimated/jest/resolver',
    setupFiles: ['./jest.setup.js'],
    testPathIgnorePatterns: ['/node_modules/', '/\\.expo/'],
    // The "react-native" exports of immer and react-redux are ES modules Jest cannot require;
    // use their CommonJS builds.
    moduleNameMapper: {
        '^immer$': '<rootDir>/node_modules/immer/dist/cjs/index.js',
        '^react-redux$': '<rootDir>/node_modules/react-redux/dist/cjs/index.js',
    },
    // @dutch-pub/shared resolves to ../packages/shared (outside node_modules). Its dist is
    // already compiled CommonJS: transforming it again would add Babel runtime imports that
    // cannot be resolved from there.
    transformIgnorePatterns: [...expoPreset.transformIgnorePatterns, '/packages/shared/dist/'],
};

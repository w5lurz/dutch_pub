module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: ['plugin:react/recommended', 'airbnb-typescript', 'plugin:import/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
    },
    plugins: ['react', '@typescript-eslint', 'import'],
    rules: {
        'react/react-in-jsx-scope': 0,
        '@typescript-eslint/indent': 0,
        '@typescript-eslint/no-unused-vars': 0,
        '@typescript-eslint/no-shadow': 1,
    },
};

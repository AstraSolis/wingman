const js = require('@eslint/js');
const react = require('eslint-plugin-react');
const globals = require('globals');

const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      '@typescript-eslint': tsPlugin
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^React$' }
      ],
      'no-console': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error'
    },
    settings: {
      react: { version: 'detect' }
    }
  },
  {
    ignores: ['dist', 'out', 'node_modules', '*.config.js']
  }
];

import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  js.configs.recommended,
  eslintPluginPrettierRecommended,
  eslintConfigPrettier,
  globalIgnores([
    'node_modules/*',
    'src/thirdparty/*',
    'src/pairtest/lib/*',
    'test/unit/pairtest/TicketService.test.js',
  ]),
  {
    files: ['**/*.js'],
    plugins: {
      js,
    },
    rules: {
      'prettier/prettier': ['error', { singleQuote: true }],
      quotes: ['error', 'single', { avoidEscape: true }],
      'prefer-template': 'error',
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
    },
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },
]);

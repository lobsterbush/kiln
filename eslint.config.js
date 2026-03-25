import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  // Base rules for all TS/TSX files
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Every instance in this codebase is an async data-load (fetch → setState),
      // the standard React pattern before adopting Suspense / React Query.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  // Typed rules — only applied to src/ where tsconfig.app.json coverage exists.
  // Only enable the specific typed rule we care about (no-floating-promises) to
  // avoid importing the full recommendedTypeChecked config which adds ~50 rules.
  {
    files: ['src/**/*.{ts,tsx}'],
    // Exclude test files — they're not in tsconfig.app.json so typed parsing fails on them
    ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/__mocks__/**'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Catch unawaited async calls that silently swallow errors
      // Set to warn so the rule surfaces issues without blocking CI until
      // all 76 existing floating-promise patterns are resolved.
      '@typescript-eslint/no-floating-promises': 'warn',
    },
  },
])

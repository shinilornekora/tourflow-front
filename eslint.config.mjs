import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import boundaries from 'eslint-plugin-boundaries';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const resolver = path.join(path.dirname(fileURLToPath(import.meta.url)), 'eslint-resolver.cjs');

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'public/mockServiceWorker.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Feature-Sliced Design: слой импортирует только нижележащие слои,
  // а в чужой слайс заходит только через его публичный API (index.ts).
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { [resolver]: {} },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app', mode: 'folder' },
        { type: 'entry', pattern: 'src/main.tsx', mode: 'file' },
        { type: 'demo', pattern: 'src/demo', mode: 'folder' },
        { type: 'pages', pattern: 'src/pages/*', mode: 'folder', capture: ['slice'] },
        { type: 'widgets', pattern: 'src/widgets/*', mode: 'folder', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', mode: 'folder', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*', mode: 'folder', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared', mode: 'folder' },
        { type: 'test', pattern: 'src/test', mode: 'folder' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'entry', allow: ['app', 'demo', 'shared'] },
            { from: 'demo', allow: ['shared', 'test'] },
            { from: 'app', allow: ['pages', 'widgets', 'features', 'entities', 'shared'] },
            { from: 'pages', allow: ['widgets', 'features', 'entities', 'shared'] },
            { from: 'widgets', allow: ['features', 'entities', 'shared'] },
            { from: 'features', allow: ['entities', 'shared'] },
            { from: 'entities', allow: ['shared', ['entities', { slice: 'session' }]] },
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          rules: [
            { target: ['widgets', 'features', 'entities'], allow: 'index.ts' },
            { target: ['pages'], allow: ['index.tsx', '*Page.tsx'] },
            { target: ['shared', 'app', 'demo', 'test'], allow: '**' },
          ],
        },
      ],
    },
  },
  {
    files: ['webpack/**/*.cjs', 'eslint-resolver.cjs'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  prettier,
);

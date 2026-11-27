// Общая часть конфигурации webpack: вход, TypeScript, алиасы, ассеты, HTML.
// Код приложения общий с Vite (vite.config.ts) — это второй сборщик для сравнения.
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const root = path.resolve(__dirname, '..');
// Те же переменные, что и у Vite: VITE_MOCK=1 — демо без бэкенда, VITE_BASE — подпапка.
const base = process.env.VITE_BASE || '/';
const mock = process.env.VITE_MOCK || '';

module.exports = {
  entry: path.join(root, 'src/main.tsx'),
  output: {
    path: path.join(root, 'dist'),
    publicPath: base,
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: { '@': path.join(root, 'src') },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          // Типы проверяет отдельный `npm run typecheck` (tsc), сборка только транспилирует.
          options: { transpileOnly: true, compilerOptions: { noEmit: false } },
        },
      },
      // SVG до 4 КБ встраиваются как data URL, крупнее — отдельным файлом.
      { test: /\.svg$/, type: 'asset', parser: { dataUrlCondition: { maxSize: 4 * 1024 } } },
      { test: /\.(png|jpe?g|webp|woff2?)$/, type: 'asset/resource' },
    ],
  },
  plugins: [
    // Код использует import.meta.env (стиль Vite) — подставляем значения при сборке.
    new webpack.DefinePlugin({
      'import.meta.env.VITE_MOCK': JSON.stringify(mock),
      'import.meta.env.BASE_URL': JSON.stringify(base),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'index.html'),
      favicon: path.join(root, 'public/favicon.svg'),
    }),
    // mockServiceWorker.js нужен демо-режиму (MSW в браузере).
    ...(mock
      ? [new CopyPlugin({ patterns: [{ from: path.join(root, 'public/mockServiceWorker.js') }] })]
      : []),
  ],
};

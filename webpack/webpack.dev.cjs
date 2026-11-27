// Разработка: быстрые пересборки, HMR, proxy /api → gateway бэкенда.
// SPA и API на одном origin (localhost:3000) — refresh-cookie работает без CORS.
const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  output: { filename: '[name].js' },
  module: {
    rules: [{ test: /\.css$/, use: ['style-loader', 'css-loader'] }],
  },
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: process.env.VITE_GATEWAY_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    ],
  },
});

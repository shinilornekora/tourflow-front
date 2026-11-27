// Продакшен-сборка. Оптимизации:
//  - contenthash в именах файлов → долгий кэш, при релизе меняются только изменившиеся чанки;
//  - splitChunks: react и effector в отдельных vendor-чанках, они меняются реже кода приложения;
//  - runtimeChunk: манифест модулей отдельно, чтобы не инвалидировать vendor-чанки;
//  - страницы грузятся лениво (React.lazy) → первый экран меньше;
//  - минификация JS (terser) и CSS, tree shaking (mode=production);
//  - hidden-source-map: карты для разбора ошибок есть, но браузер их не грузит.
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const common = require('./webpack.common.cjs');

const plugins = [new MiniCssExtractPlugin({ filename: 'assets/[name].[contenthash:8].css' })];
if (process.env.ANALYZE) {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  plugins.push(new BundleAnalyzerPlugin());
}

module.exports = merge(common, {
  mode: 'production',
  devtool: 'hidden-source-map',
  output: {
    filename: 'assets/[name].[contenthash:8].js',
    chunkFilename: 'assets/[name].[contenthash:8].js',
    assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
  },
  module: {
    rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }],
  },
  plugins,
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    minimizer: ['...', new CssMinimizerPlugin()],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/,
          name: 'vendor-react',
          priority: 30,
        },
        effector: {
          test: /[\\/]node_modules[\\/](effector|effector-react|use-sync-external-store)[\\/]/,
          name: 'vendor-effector',
          priority: 20,
        },
      },
    },
  },
  performance: { hints: 'warning', maxEntrypointSize: 500 * 1024, maxAssetSize: 300 * 1024 },
});

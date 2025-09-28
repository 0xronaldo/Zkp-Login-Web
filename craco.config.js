const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Agregar polyfills para módulos Node.js
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert/'),
        util: require.resolve('util/'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        url: require.resolve('url/'),
        process: require.resolve('process/browser.js'),
        crypto: false, // Para snarkjs, deshabilitar crypto nativo
        fs: false,
        path: false,
      };

      // Agregar plugins necesarios
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer'],
        }),
      ];

      // Ignorar source map warnings para dependencias sin source maps
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
      ];

      return webpackConfig;
    },
  },
};
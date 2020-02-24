const path = require('path')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const webpack = require('webpack')
const env = process.env.WEBPACK_ENV
const logger = require('webpack/lib/logging/runtime');

const log = logger.getLogger('constellation-app');
// import SriPlugin from 'webpack-subresource-integrity';
const SriPlugin = require('webpack-subresource-integrity');


// Simply configure those 4 variables:
const JS_SOURCE_FILES = ['babel-polyfill', './src/js/index.js', 'photoswipe', 'photoswipe/src/js/ui/photoswipe-ui-default.js']
const OUTPUT_FILENAME = 'app'
const DEST_FOLDER = 'dist/assets/js'
const COPYRIGHT = `Copyright ©2008-2020 Holly Sydney.`

const OUTPUT_FILE = `${OUTPUT_FILENAME}.js`
const OUTPUT_FILE_MIN = `${OUTPUT_FILENAME}.min.js`

const { plugins, outputfile, mode } = env == 'build'
  ? {
    plugins: [
      // new UglifyJSPlugin(),
      new webpack.BannerPlugin(COPYRIGHT),
      new webpack.ProvidePlugin({
        PhotoSwipe: 'photoswipe',
        PhotoSwipeUI_Default: 'photoswipe/src/js/ui/photoswipe-ui-default.js'
      }),
      new SriPlugin({
        hashFuncNames: ['sha256', 'sha384'],
        enabled: process.env.NODE_ENV === 'production',
      }),
    ],
    outputfile: OUTPUT_FILE_MIN,
    mode: 'production'
  }
  : {
    plugins: [
      new webpack.BannerPlugin(COPYRIGHT),
      new webpack.ProvidePlugin({
        PhotoSwipe: 'photoswipe',
        PhotoSwipeUI_Default: 'photoswipe/src/js/ui/photoswipe-ui-default.js'
      })
    ],
    outputfile: OUTPUT_FILE,
    mode: 'development'
  }

module.exports = {
  mode,
  entry: JS_SOURCE_FILES,
  output: {
    path: path.join(__dirname, DEST_FOLDER),
    filename: outputfile,
    libraryTarget: 'umd',
    umdNamedDefine: true,
    crossOriginLoading: 'anonymous',
  },
  module: {
    rules: [{
      // Only run `.js` files through Babel
      test: /\.m?js$/,
      exclude: /(node_modules)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env',
            {
              plugins: [
                '@babel/plugin-proposal-class-properties'
              ]
            }
          ]
        },
      },
    },
    {
      test: /\.s[ac]ss$/i,
      use: [
        // Creates `style` nodes from JS strings
        'style-loader',
        // Translates CSS into CommonJS
        'css-loader',
        // Compiles Sass to CSS
        'sass-loader',
      ],
    },
    {
      test: /\.(png|svg|jpe?g|gif|woff2?|ttf|eot)$/,
      use: [{
        loader: 'file-loader',
        options: {
          outputPath: (url, resourcePath, context) => {
            log.info(url)
            return `../images/${url}`;
          },
          publicPath: '/assets/images',
        }
      }]
    },
    ]
  },
  resolve: {
    extensions: ['.js', '.css', '.scss']
  },
  devtool: 'source-map',
  plugins: plugins
}

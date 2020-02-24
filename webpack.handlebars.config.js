const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HandlebarsWebpackPlugin = require("handlebars-webpack-plugin");
const SriPlugin = require('webpack-subresource-integrity');

const env = process.env.WEBPACK_ENV
const logger = require('webpack/lib/logging/runtime');

const log = logger.getLogger('constellation-app');


const JS_SOURCE_FILES = ['babel-polyfill', './src/js/index.js', 'photoswipe', 'photoswipe/src/js/ui/photoswipe-ui-default.js']
const OUTPUT_FILENAME = 'app'
const DEST_FOLDER = 'dist'
const COPYRIGHT = `Copyright ©2008-2020 Holly Sydney.`

const DEFAULT_DATA = {
  title: "Biennale Of Sydney 2008 Online Venue",
};


const OUTPUT_FILE = `${OUTPUT_FILENAME}.js`
const OUTPUT_FILE_MIN = `${OUTPUT_FILENAME}.min.js`

const outputfile = OUTPUT_FILE_MIN;

const webpackConfig = {
  mode: 'production',
  entry: JS_SOURCE_FILES,
  output: {
    path: path.join(__dirname, DEST_FOLDER, "assets", "js"),
    filename: outputfile,
    libraryTarget: 'umd',
    umdNamedDefine: true,
    crossOriginLoading: 'anonymous',
  },
  module: {
    rules: [
      {
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
            ],
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
        }
      ]
    },
    ]
  },
  resolve: {
    extensions: ['.js', '.css', '.scss']
  },
  devtool: 'source-map',

  plugins: [
    new SriPlugin({
      hashFuncNames: ['sha256', 'sha384'],
      enabled: process.env.NODE_ENV === 'production',
    }),

    new HtmlWebpackPlugin({
      title: "Generic Head Title",
      // the template you want to use
      template: path.join(__dirname, "src", "templates", "partials", "_head.hbs"),
      // the output file name
      filename: path.join(__dirname, "src", "templates", "partials", "generated", "_head.hbs"),
      inject: "head"
    }),

    new HandlebarsWebpackPlugin({
      htmlWebpackPlugin: {
        enabled: true, // register all partials from html-webpack-plugin, defaults to `false`
        prefix: "generated" // where to look for htmlWebpackPlugin output. default is "html"
      },

      data: require(path.join(process.cwd(), "src", "assets", "data", "data.json")),

      entry: path.join(process.cwd(),  "src", "templates", "*.hbs"),
      output: path.join(process.cwd(), "dist", "[name].html"),

      partials: [
        path.join(process.cwd(), "src", "templates", "partials", "**", "*.hbs"),
      ],

      // register custom helpers. May be either a function or a glob-pattern
      helpers: {
        eq: function(a, b) {
          return a === b;
        }
      },

      /**
       * Modify the hbs partial-id created for a loaded partial
       * @param {String} filePath   - filePath to the loaded partial
       * @return {String} hbs-partialId, remove leading underscore and partial
       * directory.
       */
      getPartialId: function (path) {
        let id = path.match(/\/([^/]+\/[^/]+)\.[^.]+$/).pop();
        id = id.replace("partials/_", "").replace("/_", "/");
        return id;
      },

      /* Patched module `.onBeforeRender`` to provide compiled template and the plugin itself.
       *    const data = this.options.onBeforeRender(Handlebars, this.data, sourcePath, template, this) || this.data;
       */
      onBeforeRender: function (Handlebars, data, filename, template, plugin) {
        const self = this;

        data.default = DEFAULT_DATA;

        if ( filename.indexOf("record.hbs") < 0 ) return;

        log.info("Filename ", filename);

        // foreach data.record as record.
        data.record.forEach(record => {
          const result = template({default: DEFAULT_DATA, record: record});
          const targetFilepath = path.join("..", "..", "record", record.category.nicename, record.id + "", "index.html");

          // plugin.registerGeneratedFile(targetFilepath, result);
          plugin.assetsToEmit[targetFilepath] = {
            source: () => result,
            size: () => result.length
          };
        });

      },

    })
  ]
};

module.exports = webpackConfig;

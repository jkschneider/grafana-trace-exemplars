const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
  target: 'node',
  watch: true,
  context: __dirname + "/src",
  entry: './module.ts',
  output: {
    filename: "module.js",
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: "amd"
  },
  externals: [
    // remove the line below if you don't want to use buildin versions
    'jquery', 'lodash', 'moment', 'angular',
    'react', 'react-dom', '@grafana/ui', 
    '@grafana/data', '@grafana/runtime',
    'slate', 'slate-react',
    function(context, request, callback) {
      var prefix = 'grafana/';
      if (request.indexOf(prefix) === 0) {
        return callback(null, request.substr(prefix.length));
      }
      callback();
    }
  ],
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new CopyWebpackPlugin([
      { from: 'plugin.json' },
      { from: 'img/*' },
      { from: '**/*.html' }
    ])
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".html", ".json"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: {
          loader: 'tslint-loader',
          options: {
            emitErrors: true,
            typeCheck: false,
          }
        }
      },
      {
        test: /\.tsx?$/,
        loaders: [
          {
            loader: "babel-loader"
          },
          "ts-loader"
        ],
        exclude: /node_modules/,
      }
    ]
  }
}

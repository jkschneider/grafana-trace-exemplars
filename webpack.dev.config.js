const baseWebpackConfig = require('./webpack.prod.config');

var conf = baseWebpackConfig;
conf.watch = true;
conf.devtool = 'source-map';

module.exports = conf;
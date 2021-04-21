const GitVersionPlugin = require('../../../src/index.js')

module.exports = {
  mode: 'development',
  devtool: false,
  plugins: [new GitVersionPlugin()],
}

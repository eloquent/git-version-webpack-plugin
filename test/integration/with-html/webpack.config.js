const GitVersionPlugin = require("../../../src/index.js");
const HtmlPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  devtool: false,
  plugins: [new HtmlPlugin(), new GitVersionPlugin()],
};

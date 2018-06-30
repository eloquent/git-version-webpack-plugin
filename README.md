# Git version Webpack plugin

*Pull Git version information into Webpack.*

[![Current version image][version-image]][current version]
[![Current build status image][build-image]][current build status]
[![Current coverage status image][coverage-image]][current coverage status]

[build-image]: https://img.shields.io/travis/com/eloquent/git-version-webpack-plugin/master.svg?style=flat-square "Current build status for the master branch"
[coverage-image]: https://img.shields.io/codecov/c/github/eloquent/git-version-webpack-plugin/master.svg?style=flat-square "Current test coverage for the master branch"
[current build status]: https://travis-ci.com/eloquent/git-version-webpack-plugin
[current coverage status]: https://codecov.io/github/eloquent/git-version-webpack-plugin
[current version]: https://www.npmjs.com/package/@eloquent/git-version-webpack-plugin
[version-image]: https://img.shields.io/npm/v/@eloquent/git-version-webpack-plugin.svg?style=flat-square "This project uses semantic versioning"

## Installation

- Available as NPM package [@eloquent/git-version-webpack-plugin]

[@eloquent/git-version-webpack-plugin]: https://www.npmjs.com/package/@eloquent/git-version-webpack-plugin

### Standalone usage

~~~js
// webpack.config.js

const GitVersionPlugin = require('@eloquent/git-version-webpack-plugin')

module.exports = {
  plugins: [
    new GitVersionPlugin(),
  ],
}
~~~

### Usage with [html-webpack-plugin]

~~~js
// webpack.config.js

const GitVersionPlugin = require('@eloquent/git-version-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')

module.exports = {
  plugins: [
    new HtmlPlugin(),
    new GitVersionPlugin(),
  ],
}
~~~

Note that the order of plugins is significant. That is, `HtmlWebpackPlugin` must
appear before `GitVersionPlugin`.

## Features

- Adds a single, concise, human-readable `VERSION` file to the Webpack output.
- Integrates with [html-webpack-plugin], automatically adding a `VERSION`
  variable, accessible on the `window` object.
- Works with or without [html-webpack-template].
- Watches the Git directory for changes when using [webpack-serve] or
  [webpack-dev-server], so that the version always reflects the current Git tag
  or branch.

## Configuration

The following options can be passed to the plugin constructor:

- `path` - The path to use for the version file, relative to the [output path].
           Defaults to `VERSION`.
- `name` - The name to use for the version variable, accessible on the `window`
           object. Defaults to `VERSION`.

[html-webpack-plugin]: https://github.com/jantimon/html-webpack-plugin
[html-webpack-template]: https://github.com/jaketrent/html-webpack-template
[output path]: https://webpack.js.org/configuration/output/#output-path
[webpack-dev-server]: https://github.com/webpack/webpack-dev-server
[webpack-serve]: https://github.com/webpack-contrib/webpack-serve

# Git version Webpack plugin

*Pull Git version information into Webpack*

[![Current version][badge-version-image]][badge-version-link]
[![Build status][badge-build-image]][badge-build-link]
[![Test coverage][badge-coverage-image]][badge-coverage-link]

[badge-build-image]: https://img.shields.io/github/workflow/status/eloquent/git-version-webpack-plugin/CI?style=for-the-badge
[badge-build-link]: https://github.com/eloquent/git-version-webpack-plugin/actions/workflows/ci.yml
[badge-coverage-image]: https://img.shields.io/codecov/c/gh/eloquent/git-version-webpack-plugin?style=for-the-badge
[badge-coverage-link]: https://codecov.io/gh/eloquent/git-version-webpack-plugin
[badge-version-image]: https://img.shields.io/npm/v/@eloquent/git-version-webpack-plugin?label=%40eloquent%2Fgit-version-webpack-plugin&logo=npm&style=for-the-badge
[badge-version-link]: https://npmjs.com/package/@eloquent/git-version-webpack-plugin

## Usage

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

Note that the order of plugins _may_ be significant. That is,
`HtmlWebpackPlugin` _may_ need to appear before `GitVersionPlugin`. Although
this no longer seems to be true under Webpack 5.

## Features

- Adds a single, concise, human-readable `VERSION` file to the Webpack output.
- Integrates with [html-webpack-plugin], automatically adding a `VERSION`
  variable, accessible on the `window` object.
- Watches the Git directory for changes when using [webpack-dev-server], so that
  the version always reflects the current Git tag or branch.

## Configuration

The following options can be passed to the plugin constructor:

- `path`    - The path to use for the version file, relative to the
              [output path]. Defaults to `VERSION`.
- `name`    - The name to use for the version variable, accessible on the
              `window` object. Defaults to `VERSION`.
- `version` - Can be used to manually override the version. Useful in the event
              that Git is not available.

[html-webpack-plugin]: https://github.com/jantimon/html-webpack-plugin
[output path]: https://webpack.js.org/configuration/output/#output-path
[webpack-dev-server]: https://github.com/webpack/webpack-dev-server

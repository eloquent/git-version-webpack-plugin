const HtmlPlugin = require('safe-require')('html-webpack-plugin')
const validateOptions = require('schema-utils')
const {access: accessCps} = require('fs')
const {execFile: execFileCps} = require('child_process')
const {promisify} = require('util')

const access = promisify(accessCps)
const execFile = promisify(execFileCps)

const PLUGIN_NAME = 'GitVersionWebpackPlugin'

const optionsSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://lqnt.co/git-version-webpack-plugin/config.schema.json',
  title: 'Eloquent Git version Webpack plugin configuration',
  description: 'The configuration for an instance of the Eloquent Git version Webpack plugin',
  type: 'object',
  additionalProperties: false,
  properties: {
    path: {
      description: 'The path to use for the version file, relative to the output path',
      type: 'string',
      minLength: 1,
      default: 'VERSION',
    },
    name: {
      description: 'The name to use for the version variable, accessible on the window object',
      type: 'string',
      minLength: 1,
      default: 'VERSION',
    },
    version: {
      description: 'Can be used to manually override the version. Useful in the event that Git is not available',
      type: 'string',
      default: '',
    },
  },
}

module.exports = function GitVersionWebpackPlugin (options = {}) {
  validateOptions(optionsSchema, options, {
    baseDataPath: 'options',
    name: '@eloquent/git-version-webpack-plugin',
  })

  const {
    path: versionFilePath = 'VERSION',
    name: versionName = 'VERSION',
    version: userVersion = '',
  } = options

  this.apply = compiler => {
    compiler.hooks.compilation.tap(PLUGIN_NAME, handleCompilation)
    compiler.hooks.emit.tapPromise(PLUGIN_NAME, handleEmit)
  }

  this.version = version

  async function version () {
    if (userVersion) return userVersion

    try {
      const {stdout: describe} = await execFile('git', ['describe', '--long', '--tags'])
      const [, tag, offset] = describe.toString().trim().match(/^(.*)-(\d+)-g[0-9a-f]+$/)

      if (parseInt(offset) === 0) return tag
    } catch (e) {
      // no tags
    }

    const [{stdout: branch}, {stdout: hash}] = await Promise.all([
      execFile('git', ['rev-parse', '--abbrev-ref', 'HEAD']),
      execFile('git', ['rev-parse', 'HEAD']),
    ])

    return `${branch.toString().trim()}@${hash.toString().substring(0, 7)}`
  }

  function handleCompilation (compilation) {
    if (HtmlPlugin.getHooks) {
      HtmlPlugin.getHooks(compilation).alterAssetTags.tapPromise(PLUGIN_NAME, handleAlterAssetTags)
    } else {
      compilation.hooks.htmlWebpackPluginAlterAssetTags &&
        compilation.hooks.htmlWebpackPluginAlterAssetTags.tapPromise(PLUGIN_NAME, handleAlterAssetTagsV3)
    }
  }

  async function handleEmit ({assets, fileDependencies, contextDependencies}) {
    // create the version file
    try {
      const v = await version()

      assets[versionFilePath] = {
        source: () => v + '\n',
        size: () => v.length + 1,
      }
    } catch (e) {
      assets[versionFilePath] = {
        source: () => '',
        size: () => 0,
      }
    }

    if (userVersion) return

    // watch for version changes
    try {
      await access('.git')
    } catch (e) {
      return // no .git directory
    }

    fileDependencies.add('.git/logs/HEAD') // commit hash and branch changes
    contextDependencies.add('.git/refs/tags') // tag changes
  }

  async function handleAlterAssetTags (data) {
    let v

    try {
      v = await version()
    } catch (e) {
      v = ''
    }

    const {assetTags: {scripts}} = data

    scripts.unshift({
      tagName: 'script',
      voidTag: false,
      attributes: {
        type: 'text/javascript',
      },
      innerHTML: `window[${JSON.stringify(versionName)}] = ${JSON.stringify(v)}`,
    })

    return data
  }

  async function handleAlterAssetTagsV3 (data) {
    let v

    try {
      v = await version()
    } catch (e) {
      v = ''
    }

    const {body} = data

    body.unshift({
      tagName: 'script',
      closeTag: true,
      attributes: {
        type: 'text/javascript',
      },
      innerHTML: `window[${JSON.stringify(versionName)}] = ${JSON.stringify(v)}`,
    })

    return data
  }
}

const HtmlPlugin = require('safe-require')('html-webpack-plugin')
const {validate} = require('schema-utils')
const {access: accessCps} = require('fs')
const {join} = require('path')
const {execFile: execFileCps} = require('child_process')
const {promisify} = require('util')
const {Compilation} = require('webpack')

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
  validate(optionsSchema, options, {
    baseDataPath: 'options',
    name: '@eloquent/git-version-webpack-plugin',
  })

  const {
    path: versionFilePath = 'VERSION',
    name: versionName = 'VERSION',
    version: userVersion = '',
  } = options

  let dependsOnGit = false

  this.apply = compiler => {
    compiler.hooks.beforeCompile.tapPromise(PLUGIN_NAME, handleBeforeCompile)
    compiler.hooks.compilation.tap(PLUGIN_NAME, handleCompilation)
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

  async function handleBeforeCompile () {
    if (userVersion) return

    try {
      await access('.git')
      dependsOnGit = true
    } catch (e) {
      dependsOnGit = false
    }
  }

  function handleCompilation (compilation) {
    if (dependsOnGit) {
      const {context} = compilation.compiler
      compilation.fileDependencies.add(join(context, '.git/logs/HEAD')) // commit hash and branch changes
      compilation.contextDependencies.add(join(context, '.git/refs/tags')) // tag changes
    }

    compilation.hooks.processAssets.tapPromise(
      {name: PLUGIN_NAME, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL},
      handleProcessAssets,
    )

    if (HtmlPlugin) HtmlPlugin.getHooks(compilation).alterAssetTags.tapPromise(PLUGIN_NAME, handleAlterAssetTags)
  }

  async function handleProcessAssets (assets) {
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
}

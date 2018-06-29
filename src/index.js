const {access: accessCallback} = require('fs')
const {execFile: execFileCallback} = require('child_process')

module.exports = class GitVersionWebpackPlugin {
  constructor (options = {}) {
    this.options = Object.assign({path: 'VERSION'}, options)
  }

  apply (compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      update.call(this, compilation)
        .then(callback)
        .catch(callback)
    })
  }

  async version () {
    try {
      const describe = await execFile('git', ['describe', '--long', '--tags'])
      const [, tag, offset] = describe.toString().trim().match(/^(.*)-(\d+)-g[0-9a-f]+$/)

      if (parseInt(offset) === 0) return tag
    } catch (e) {
      // no tags
    }

    const [branch, hash] = await Promise.all([
      execFile('git', ['rev-parse', '--abbrev-ref', 'HEAD']),
      execFile('git', ['rev-parse', 'HEAD']),
    ])

    return `${branch.toString().trim()}@${hash.toString().substring(0, 7)}`
  }
}

async function update (compilation) {
  const {path} = this.options
  let version

  // create the version file
  try {
    version = await this.version()

    compilation.assets[path] = {
      source: () => version + '\n',
      size: () => version.length + 1,
    }
  } catch (e) {
    version = null

    compilation.assets[path] = {
      source: () => '',
      size: () => 0,
    }
  }

  // add version to template variables
  compilation.plugin('html-webpack-plugin-before-html-generation', (data, callback) => {
    const {plugin} = data

    if (!plugin) return callback(new Error('Missing plugin data.'))

    const jsonVersion = JSON.stringify(version)
    const {options: {templateParameters} = {}} = plugin
    const templateParametersType = typeof templateParameters

    if (templateParametersType === 'object') {
      plugin.options.templateParameters.version = jsonVersion
    } else if (templateParametersType === 'function') {
      const originalFunction = templateParameters.versionWebpackPluginWrapped || templateParameters

      plugin.options.templateParameters = (...args) => {
        return Object.assign({version: jsonVersion}, originalFunction(...args))
      }
      plugin.options.templateParameters.versionWebpackPluginWrapped = originalFunction
    }

    callback()
  })

  // watch for version changes
  try {
    await access('.git')

    compilation.fileDependencies.push('.git/logs/HEAD') // commit hash and branch changes
    compilation.contextDependencies.push('.git/refs/tags') // tag changes
  } catch (e) {
    // no .git directory
  }
}

function execFile (command, args) {
  return new Promise((resolve, reject) => {
    execFileCallback(command, args, (error, stdout) => {
      if (error) return reject(error)

      return resolve(stdout)
    })
  })
}

function access (path) {
  return new Promise((resolve, reject) => {
    accessCallback(path, error => error ? reject(error) : resolve())
  })
}

const {access: accessCallback} = require('fs')
const {execFile: execFileCallback} = require('child_process')

module.exports = function GitVersionWebpackPlugin ({
  path: versionFilePath = 'VERSION',
} = {}) {
  this.version = async () => {
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

  const handleEmit = async ({assets, fileDependencies, contextDependencies}) => {
    let version

    // create the version file
    try {
      version = await this.version()

      assets[versionFilePath] = {
        source: () => version + '\n',
        size: () => version.length + 1,
      }
    } catch (e) {
      version = null

      assets[versionFilePath] = {
        source: () => '',
        size: () => 0,
      }
    }

    // watch for version changes
    try {
      await access('.git')
    } catch (e) {
      return // no .git directory
    }

    // commit hash and branch changes
    if (fileDependencies.add) {
      fileDependencies.add('.git/logs/HEAD')
    } else {
      fileDependencies.push('.git/logs/HEAD')
    }

    // tag changes
    if (contextDependencies.add) {
      contextDependencies.add('.git/refs/tags')
    } else {
      contextDependencies.push('.git/refs/tags')
    }
  }

  const handleHtml = async ({plugin}) => {
    if (!plugin) throw new Error('Missing html-webpack-plugin data.')

    let version

    try {
      version = JSON.stringify(await this.version())
    } catch (e) {
      version = JSON.stringify(null)
    }

    const {options: {templateParameters} = {}} = plugin
    const templateParametersType = typeof templateParameters

    if (templateParametersType === 'object') {
      plugin.options.templateParameters.version = version
    } else if (templateParametersType === 'function') {
      const originalFunction = templateParameters.versionWebpackPluginWrapped || templateParameters

      plugin.options.templateParameters = (...args) => {
        return Object.assign({version}, originalFunction(...args))
      }
      plugin.options.templateParameters.versionWebpackPluginWrapped = originalFunction
    }
  }

  this.apply = compiler => {
    if (compiler.hooks) {
      compiler.hooks.emit.tapPromise('GitVersionWebpackPlugin', handleEmit)
      compiler.hooks.emit.tapPromise('htmlWebpackPluginBeforeHtmlGeneration', handleHtml)
    } else {
      compiler.plugin('emit', (compilation, callback) => {
        handleEmit(compilation).then(callback).catch(callback)
      })

      compiler.plugin('html-webpack-plugin-before-html-generation', (data, callback) => {
        handleHtml(data).then(callback).catch(callback)
      })
    }
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

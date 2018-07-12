const {access: accessCallback} = require('fs')
const {execFile: execFileCallback} = require('child_process')

module.exports = function GitVersionWebpackPlugin ({
  path: versionFilePath = 'VERSION',
  name: versionName = 'VERSION',
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

  const handleBeforeHtml = async data => {
    const {plugin} = data
    const {options = {}} = plugin
    const {window = {}} = options

    window[versionName] = await this.version()

    options.window = window
    plugin.options = options

    return data
  }

  const handleAssetTags = async data => {
    const version = await this.version()

    const {body} = data

    body.unshift({
      tagName: 'script',
      closeTag: true,
      attributes: {
        type: 'text/javascript',
      },
      innerHTML: `window[${JSON.stringify(versionName)}] = ${JSON.stringify(version)}`,
    })

    return data
  }

  const handleCompilation = compilation => {
    tapPromise(compilation, 'htmlWebpackPluginBeforeHtmlGeneration', 'html-webpack-plugin-before-html-generation', handleBeforeHtml)
    tapPromise(compilation, 'htmlWebpackPluginAlterAssetTags', 'html-webpack-plugin-alter-asset-tags', handleAssetTags)
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

    addOrPush(fileDependencies, '.git/logs/HEAD') // commit hash and branch changes
    addOrPush(contextDependencies, '.git/refs/tags') // tag changes
  }

  this.apply = compiler => {
    tap(compiler, 'compilation', 'compilation', handleCompilation)
    tapPromise(compiler, 'emit', 'emit', handleEmit)
  }
}

function tap (subject, name, legacyName, handler) {
  if (subject.hooks) {
    subject.hooks[name].tap('GitVersionWebpackPlugin', handler)
  } else {
    subject.plugin(legacyName, handler)
  }
}

function tapPromise (subject, name, legacyName, handler) {
  if (subject.hooks) {
    subject.hooks[name].tapPromise('GitVersionWebpackPlugin', handler)
  } else {
    subject.plugin(legacyName, (data, callback) => {
      handler(data)
        .then(data => callback(null, data))
        .catch(callback)
    })
  }
}

function addOrPush (subject, entry) {
  subject.add ? subject.add(entry) : subject.push(entry)
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

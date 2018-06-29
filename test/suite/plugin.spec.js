const rmfr = require('rmfr')
const {execFileSync} = require('child_process')
const {expect} = require('chai')
const {mkdtempSync} = require('fs')
const {tmpdir} = require('os')

const GitVersionWebpackPlugin = require('../../src/index')

describe('GitVersionWebpackPlugin', function () {
  beforeEach(function () {
    this.workingPath = process.cwd()
    this.temporaryPath = mkdtempSync(process.env.CI ? '/tmp' : tmpdir())

    process.chdir(this.temporaryPath)
  })

  afterEach(async function () {
    process.chdir(this.workingPath)

    await rmfr(this.temporaryPath)
  })

  context('when there is no .git directory', function () {
    beforeEach(function () {
      this.subject = new GitVersionWebpackPlugin()
    })

    describe('version()', function () {
      it('should throw an exception', async function () {
        let error

        try {
          await this.subject.version()
        } catch (e) {
          error = e
        }

        expect(error).to.exist()
      })
    })
  })

  context('when there is a .git directory, but no commits', function () {
    beforeEach(function () {
      this.subject = new GitVersionWebpackPlugin()

      execFileSync('git', ['init'])
    })

    describe('version()', function () {
      it('should throw an exception', async function () {
        let error

        try {
          await this.subject.version()
        } catch (e) {
          error = e
        }

        expect(error).to.exist()
      })
    })
  })

  context('when there is a commit', function () {
    beforeEach(function () {
      this.subject = new GitVersionWebpackPlugin()

      execFileSync('git', ['init'])
      execFileSync('git', ['commit', '--allow-empty', '--message', 'Commit message.'])
    })

    context('on an un-tagged commit', function () {
      describe('version()', function () {
        it('should return the branch name and short commit hash', async function () {
          expect(await this.subject.version()).to.match(/^master@[a-f0-9]{7}$/)
        })
      })
    })

    context('on a commit with an annotated tag', function () {
      beforeEach(function () {
        execFileSync('git', ['tag', '--annotate', '--message', 'Tag message.', '1.2.3'])
      })

      describe('version()', function () {
        it('should return the tag name', async function () {
          expect(await this.subject.version()).to.equal('1.2.3')
        })
      })
    })

    context('on a commit with a lightweight tag', function () {
      beforeEach(function () {
        execFileSync('git', ['tag', '1.2.3'])
      })

      describe('version()', function () {
        it('should return the tag name', async function () {
          expect(await this.subject.version()).to.equal('1.2.3')
        })
      })
    })

    context('on a commit with both annotated and lightweight tags', function () {
      beforeEach(function () {
        execFileSync('git', ['tag', '--annotate', '--message', 'Tag message.', '1.2.3'])
        execFileSync('git', ['tag', '4.5.6'])
      })

      describe('version()', function () {
        it('should return the annotated tag name', async function () {
          expect(await this.subject.version()).to.equal('1.2.3')
        })
      })
    })

    context('on a commit that comes after a tag', function () {
      beforeEach(function () {
        execFileSync('git', ['tag', '--annotate', '--message', 'Tag message.', '1.2.3'])
        execFileSync('git', ['commit', '--allow-empty', '--message', 'Commit message.'])
      })

      describe('version()', function () {
        it('should return the branch name and short commit hash', async function () {
          expect(await this.subject.version()).to.match(/^master@[a-f0-9]{7}$/)
        })
      })
    })
  })
})

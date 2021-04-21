const rmfr = require('rmfr')
const {execFileSync} = require('child_process')
const {join} = require('path')
const {mkdtempSync} = require('fs')
const {tmpdir} = require('os')

const GitVersionWebpackPlugin = require('../../src/index')

describe('GitVersionWebpackPlugin', () => {
  let temporaryPath, workingPath

  beforeEach(() => {
    workingPath = process.cwd()
    temporaryPath = mkdtempSync(join(tmpdir(), 'git-version-webpack-plugin-'))

    process.chdir(temporaryPath)
  })

  afterEach(async () => {
    process.chdir(workingPath)

    await rmfr(temporaryPath)
  })

  describe('when there is no .git directory', () => {
    let subject

    beforeEach(() => {
      subject = new GitVersionWebpackPlugin()
    })

    describe('version()', () => {
      it('should throw an exception', async () => {
        await expect(subject.version).rejects.toThrow()
      })
    })
  })

  describe('when there is a .git directory, but no commits', () => {
    let subject

    beforeEach(() => {
      subject = new GitVersionWebpackPlugin()

      execFileSync('git', ['init'])
      execFileSync('git', ['config', 'user.email', 'test@example.com'])
      execFileSync('git', ['config', 'user.name', 'Test User'])
    })

    describe('version()', () => {
      it('should throw an exception', async () => {
        await expect(subject.version).rejects.toThrow()
      })
    })
  })

  describe('when there is a commit', () => {
    let subject

    beforeEach(() => {
      subject = new GitVersionWebpackPlugin()

      execFileSync('git', ['init'])
      execFileSync('git', ['config', 'user.email', 'test@example.com'])
      execFileSync('git', ['config', 'user.name', 'Test User'])
      execFileSync('git', ['branch', '--move', 'branch-a'])
      execFileSync('git', ['commit', '--allow-empty', '--message', 'Commit message.'])
    })

    describe('on an un-tagged commit', () => {
      describe('version()', () => {
        it('should return the branch name and short commit hash', async () => {
          expect(await subject.version()).toMatch(/^branch-a@[a-f0-9]{7}$/)
        })
      })
    })

    describe('on a commit with an annotated tag', () => {
      beforeEach(() => {
        execFileSync('git', ['tag', '--annotate', '--message', 'Tag message.', '1.2.3'])
      })

      describe('version()', () => {
        it('should return the tag name', async () => {
          expect(await subject.version()).toBe('1.2.3')
        })
      })
    })

    describe('on a commit with a lightweight tag', () => {
      beforeEach(() => {
        execFileSync('git', ['tag', '1.2.3'])
      })

      describe('version()', () => {
        it('should return the tag name', async () => {
          expect(await subject.version()).toBe('1.2.3')
        })
      })
    })

    describe('on a commit with both annotated and lightweight tags', () => {
      beforeEach(() => {
        execFileSync('git', ['tag', '--annotate', '--message', 'Tag message.', '1.2.3'])
        execFileSync('git', ['tag', '4.5.6'])
      })

      describe('version()', () => {
        it('should return the annotated tag name', async () => {
          expect(await subject.version()).toBe('1.2.3')
        })
      })
    })

    describe('on a commit that comes after a tag', () => {
      beforeEach(() => {
        execFileSync('git', ['tag', '--annotate', '--message', 'Tag message.', '1.2.3'])
        execFileSync('git', ['commit', '--allow-empty', '--message', 'Commit message.'])
      })

      describe('version()', () => {
        it('should return the branch name and short commit hash', async () => {
          expect(await subject.version()).toMatch(/^branch-a@[a-f0-9]{7}$/)
        })
      })
    })
  })

  describe('when the version is manually specified', () => {
    let subject

    beforeEach(() => {
      subject = new GitVersionWebpackPlugin({version: 'version-a'})
    })

    describe('version()', () => {
      it('should return the specified version', async () => {
        expect(await subject.version()).toBe('version-a')
      })
    })
  })
})

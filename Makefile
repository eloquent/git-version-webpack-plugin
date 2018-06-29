.DEFAULT_GOAL := test

SHELL := /bin/bash -o pipefail

SRC := $(shell find ./src 2> /dev/null)
TEST_SRC := $(shell find ./test -type f 2> /dev/null)

.PHONY: test
test: node_modules $(SRC) $(TEST_SRC)
	NODE_ENV=test node_modules/.bin/mocha --colors 'test/suite/**/*.spec.*'

.PHONY: coverage
coverage: artifacts/tests/coverage/index.html

.PHONY: coverage-open
coverage-open: | artifacts/tests/coverage/index.html
	open artifacts/tests/coverage/index.html

.PHONY: lint
lint: node_modules
	node_modules/.bin/eslint --fix --ext .js --ext .jsx . --cache --cache-location artifacts/.eslintcache

.PHONY: prepare-lint
prepare-lint:: node_modules
	node_modules/.bin/eslint --fix --ext .js --ext .jsx . --cache --cache-location artifacts/.eslintcache --config .eslintrc.release.json

.PHONY: ci-lint
ci-lint:: node_modules
	node_modules/.bin/eslint --ext .js --ext .jsx . --cache --cache-location artifacts/.eslintcache --config .eslintrc.release.json

.PHONY: clean-all
clean-all:: clean
	rm -rf ./node_modules

.PHONY: clean
clean::
	git clean -dX --force --exclude !/node_modules/

.PHONY: clean-coverage
clean-coverage:
	rm -rf artifacts/tests/coverage

.PHONY: prepare
prepare: test prepare-lint

.PHONY: ci
ci: test ci-lint

node_modules: yarn.lock
	yarn install
	@touch $@

yarn.lock: package.json
	yarn check --integrity || yarn upgrade
	@touch $@

artifacts/tests/coverage/index.html: artifacts/tests/coverage/nyc
	node_modules/.bin/nyc report --temp-directory $< --report-dir $(@D) --reporter=html

artifacts/tests/coverage/nyc: node_modules $(SRC) $(TEST_SRC)
	@mkdir -p $@
	NODE_ENV=test node_modules/.bin/nyc --temp-directory $@ --all --include 'src/**/*.js*' --extension .jsx node_modules/.bin/mocha test/suite
	@touch $@

cli
===



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/cli.svg)](https://npmjs.org/package/cli)
[![CircleCI](https://circleci.com/gh/zenclabs/typed-api/tree/master.svg?style=shield)](https://circleci.com/gh/zenclabs/typed-api/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/cli.svg)](https://npmjs.org/package/cli)
[![License](https://img.shields.io/npm/l/cli.svg)](https://github.com/zenclabs/typed-api/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @zenclabs/api
$ api COMMAND
running command...
$ api (-v|--version|version)
@zenclabs/api/0.1.13 darwin-x64 node-v10.6.0
$ api --help [COMMAND]
USAGE
  $ api COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`api generate`](#api-generate)
* [`api help [COMMAND]`](#api-help-command)

## `api generate`

describe the command here

```
USAGE
  $ api generate

OPTIONS
  -a, --api=api              (required) Path to a TypeScript API definition
  -g, --generator=generator  (required) Generator to run
  -h, --help                 show CLI help
  -l, --language=language    (required) Language to generate
  -o, --out=out              (required) Directory in which to output generated files

EXAMPLE
  $ api generate --language typescript --generator axios-client --out src/
  Generated the following files:
  - src/types.ts
  - src/validators.ts
  - src/client.ts
```

_See code: [src/commands/generate.js](https://github.com/zenclabs/typed-api/blob/v0.1.13/src/commands/generate.js)_

## `api help [COMMAND]`

display help for api

```
USAGE
  $ api help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.3/src/commands/help.ts)_
<!-- commandsstop -->

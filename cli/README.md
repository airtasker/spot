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
$ npm install -g cli
$ api COMMAND
running command...
$ api (-v|--version|version)
cli/0.0.0 darwin-x64 node-v10.6.0
$ api --help [COMMAND]
USAGE
  $ api COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`api hello [FILE]`](#api-hello-file)
* [`api help [COMMAND]`](#api-help-command)

## `api hello [FILE]`

describe the command here

```
USAGE
  $ api hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ api hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/zenclabs/typed-api/blob/v0.0.0/src/commands/hello.ts)_

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

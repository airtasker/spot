@zenclabs/api
===

A TypeScript-based DSL to generate API contracts (OpenAPI, Swagger, JSON Schema, API Blueprint), client SDKs (TypeScript, Swift, Kotlin) or even server boilerplate (e.g. Express).

Example of an API definition file `api.ts` which defines a single `POST` endpoint to create a user:
```typescript
import { api, endpoint, request } from "@zenclabs/api";

@api()
class Api {
  @endpoint({
    method: "POST",
    path: "/users"
  })
  createUser(@request req: CreateUserRequest): CreateUserResponse {
    throw "contract";
  }
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
}

interface CreateUserResponse {
  success: boolean;
}
```

You can pass the definition above to a generator by simply running:
```sh
npx @zenclabs/api generate --api api.ts
```

This is work in progress as of 3 Nov 2018:
- [x] Functional TypeScript DSL
- [x] Support for multiple files (using import statements)
- [x] OpenAPI 3 generator
- [x] OpenAPI 2 generator
- [x] JSON Schema generator
- [ ] API Blueprint generator
- [x] TypeScript axios-based client generator
- [x] TypeScript express-based server boilerplate generator
- [ ] Swift client generator
- [ ] Kotlin client generator

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@zenclabs/api.svg)](https://npmjs.org/package/@zenclabs/api)
[![CircleCI](https://circleci.com/gh/zenclabs/typed-api/tree/master.svg?style=shield)](https://circleci.com/gh/zenclabs/typed-api/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/@zenclabs/api.svg)](https://npmjs.org/package/@zenclabs/api)
[![License](https://img.shields.io/npm/l/@zenclabs/api.svg)](https://github.com/zenclabs/typed-api/blob/master/package.json)

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
@zenclabs/api/0.1.21 darwin-x64 node-v10.13.0
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
* [`api init`](#api-init)

## `api generate`

Runs a generator on an API. Used to produce client libraries, server boilerplates and well-known API contract formats such as OpenAPI.

```
USAGE
  $ api generate

OPTIONS
  -a, --api=api              (required) Path to a TypeScript API definition
  -g, --generator=generator  Generator to run
  -h, --help                 show CLI help
  -l, --language=language    Language to generate
  -o, --out=out              Directory in which to output generated files

EXAMPLE
  $ api generate --language typescript --generator axios-client --out src/
  Generated the following files:
  - src/types.ts
  - src/validators.ts
  - src/client.ts
```

_See code: [build/cli/src/commands/generate.js](https://github.com/zenclabs/typed-api/blob/v0.1.21/build/cli/src/commands/generate.js)_

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

## `api init`

Generates the boilerplate for an API.

```
USAGE
  $ api init

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ api init
  Generated the following files:
  - api.ts
  - tsconfig.json
  - package.json
```

_See code: [build/cli/src/commands/init.js](https://github.com/zenclabs/typed-api/blob/v0.1.21/build/cli/src/commands/init.js)_
<!-- commandsstop -->

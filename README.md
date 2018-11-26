Spot
===

**Spot** (*"Single Point Of Truth"*) is a concise, developer-friendly way to describe your API contract.

Leveraging the TypeScript syntax, it lets you describe your API and generate any other API contract formats you need (OpenAPI, Swagger, JSON Schema, Pact, API Blueprint), client SDKs (TypeScript, Swift, Kotlin) or even server boilerplate (e.g. Express).

You don't need to use TypeScript in your codebase to benefit from using Spot.

Example of an API definition file `api.ts` which defines a single `POST` endpoint to create a user:
```typescript
import { api, endpoint, request } from "@airtasker/spot";

@api()
class Api {
  @endpoint({
    method: "POST",
    path: "/users"
  })
  createUser(
    @request req: CreateUserRequest
  ): CreateUserResponse {
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
npx @airtasker/spot generate --api api.ts
```

This is work in progress as of 14 Nov 2018:
- [x] Functional TypeScript DSL
- [x] Support for multiple files (using import statements)
- [x] OpenAPI 3 generator
- [x] OpenAPI 2 generator
- [x] JSON Schema generator
- [ ] Pact generator
- [ ] API Blueprint generator
- [x] TypeScript axios-based client generator
- [x] TypeScript express-based server boilerplate generator

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@airtasker/spot.svg)](https://npmjs.org/package/@airtasker/spot)
[![CircleCI](https://circleci.com/gh/airtasker/spot/tree/master.svg?style=shield)](https://circleci.com/gh/airtasker/spot/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/@airtasker/spot.svg)](https://npmjs.org/package/@airtasker/spot)
[![License](https://img.shields.io/npm/l/@airtasker/spot.svg)](https://github.com/airtasker/spot/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage

To get started and set up an API declaration in the current directory, run:
```
npx @airtasker/spot init
```

You can then run a generator with:
```
npx @airtasker/spot generate --api api.ts
```

# Commands
<!-- commands -->
* [`spot generate`](#spot-generate)
* [`spot help [COMMAND]`](#spot-help-command)
* [`spot init`](#spot-init)

## `spot generate`

Runs a generator on an API. Used to produce client libraries, server boilerplates and well-known API contract formats such as OpenAPI.

```
USAGE
  $ spot generate

OPTIONS
  -a, --api=api              (required) Path to a TypeScript API definition
  -g, --generator=generator  Generator to run
  -h, --help                 show CLI help
  -l, --language=language    Language to generate
  -o, --out=out              Directory in which to output generated files

EXAMPLE
  $ spot generate --language typescript --generator axios-client --out src/
  Generated the following files:
  - src/types.ts
  - src/validators.ts
  - src/client.ts
```

_See code: [cli/src/commands/generate.js](https://github.com/zenclabs/spot/blob/master/cli/src/commands/generate.ts)_

## `spot help [COMMAND]`

display help for spot

```
USAGE
  $ spot help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.3/src/commands/help.ts)_

## `spot init`

Generates the boilerplate for an API.

```
USAGE
  $ spot init

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ spot init
  Generated the following files:
  - api.ts
  - tsconfig.json
  - package.json
```

_See code: [cli/src/commands/init.js](https://github.com/airtasker/spot/blob/master/cli/src/commands/init.ts)_
<!-- commandsstop -->

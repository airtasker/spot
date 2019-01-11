# Spot

**Spot** (_"Single Point Of Truth"_) is a concise, developer-friendly way to describe your API contract.

Leveraging the TypeScript syntax, it lets you describe your API and generate any other API contract formats you need (OpenAPI, Swagger, JSON Schema, Pact, API Blueprint), client SDKs (TypeScript, Swift, Kotlin) or even server boilerplate (e.g. Express).

You don't need to use TypeScript in your codebase to benefit from using Spot.

Example of an API definition file `api.ts` which defines a single `POST` endpoint to create a user:

```typescript
import { api, endpoint, request, response } from "@airtasker/spot";

@api({
  name: "My API",
  description: "My really cool API"
})
class Api {
  @endpoint({
    method: "POST",
    path: "/users"
  })
  createUser(@request req: CreateUserRequest): CreateUserResponse {
    return response();
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

For available methods, please check [here](https://github.com/airtasker/spot/wiki/Spot-available-methods)

You can pass the definition above to a generator by simply running:

```sh
npx @airtasker/spot generate --api api.ts
```

# Why we built Spot

At first glance, you may wonder why we bothered building Spot. Why not use OpenAPI (formely known as Swagger) to describe your API?

At the core, we built Spot because we wanted a better developer experience.

## Writing contracts

OpenAPI documents are stored as YAML files, following a very specific schema. You won’t know that you used the wrong field name or forgot to wrap a type definition into a schema object unless you run a good OpenAPI linter. Most developers who aren’t intimately familiar with the OpenAPI specification end up using a visual editor such as Swagger Editor or Stoplight.

Since Spot leverages the TypeScript syntax, all you need is to write valid TypeScript code. Your editor will immediately tell you when your code is invalid. It will tell you what’s missing, and you even get autocomplete for free. We could have picked any other typed language—TypeScript just happened to be one of the most concise and ubiquitous for us.

## Reviewing contracts

We believe that API contracts should be checked into Git, or whichever code versioning system you use. In addition, API contracts should be systematically peer reviewed. It’s far too easy for a backend engineer to incorrectly assume what client engineers expect from an endpoint.

Because of their complex nested structure and the richness of the OpenAPI specification, OpenAPI documents can be difficult to review in a pull request. They’re great for machines, but not always for humans.

Spot aims to be as human-readable as possible. We’ve seen developers become a lot more engaged in discussions on pull requests for Spot contracts, compared to our previous OpenAPI documents.

## Interoperability with various formats

Depending on what you're trying to achieve (testing, documentation, client code generation…), you'll find tools that only work with OpenAPI 2 (Swagger), and newer tools that only support OpenAPI 3. You may also find tools for a different API ecosystem such as JSON Schema or API Blueprint.

We built Spot with this in mind. Instead of having to juggle various API format converters, Spot can generate every major API document format. This is why we called it "Single Point Of Truth".

# Status

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
* [Spot](#spot)
* [Why we built Spot](#why-we-built-spot)
* [Status](#status)
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
* [`spot mock SPOT_CONTRACT`](#spot-mock-spot-contract)
* [`spot validate SPOT_CONTRACT`](#spot-validate-spot-contract)

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

_See code: [build/cli/src/commands/generate.js](https://github.com/airtasker/spot/blob/v0.1.34/build/cli/src/commands/generate.js)_

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

_See code: [build/cli/src/commands/init.js](https://github.com/airtasker/spot/blob/v0.1.34/build/cli/src/commands/init.js)_

## `spot mock SPOT_CONTRACT`

Run a mock server based on a Spot contract

```
USAGE
  $ spot mock SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help               show CLI help
  -p, --port=port          (required) [default: 3010] Port on which to run the mock server
  --pathPrefix=pathPrefix  Prefix to prepend to each endpoint path

EXAMPLE
  $ spot mock api.ts
```

_See code: [build/cli/src/commands/mock.js](https://github.com/airtasker/spot/blob/v0.1.34/build/cli/src/commands/mock.js)_

## `spot validate SPOT_CONTRACT`

Validate a Spot contract

```
USAGE
  $ spot validate SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ spot validate api.ts
```

_See code: [build/cli/src/commands/validate.js](https://github.com/airtasker/spot/blob/v0.1.34/build/cli/src/commands/validate.js)_
<!-- commandsstop -->

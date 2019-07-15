# Spot

**Spot** (_"Single Point Of Truth"_) is a concise, developer-friendly way to describe your API contract.

Leveraging the TypeScript syntax, it lets you describe your API and generate other API contract formats you need (OpenAPI, Swagger, JSON Schema).

You don't need to use TypeScript in your codebase to benefit from using Spot.

Example of an API definition file `api.ts` which defines a single `POST` endpoint to create a user:

```typescript
import { api, endpoint, request, response, body } from "@airtasker/spot";

@api({
  name: "My API"
})
class Api {}

@endpoint({
  method: "POST",
  path: "/users"
})
class CreateUser {
  @request
  request(@body body: CreateUserRequest) {}

  @response({ status: 201 })
  response(@body body: CreateUserResponse) {}
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
}

interface CreateUserResponse {
  firstName: string;
  lastName: string;
  role: string;
}
```

For available methods, please check [here](https://github.com/airtasker/spot/wiki/Spot-available-methods)

With [yarn](https://yarnpkg.com/en/docs/usage) installed and initialized add `@airtasker/spot` to your project:

```sh
yarn add @airtasker/spot
```

You can pass the definition above to a generator by simply running:

```sh
npx @airtasker/spot generate --contract api.ts
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

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@airtasker/spot.svg)](https://npmjs.org/package/@airtasker/spot)
[![CircleCI](https://circleci.com/gh/airtasker/spot/tree/master.svg?style=shield)](https://circleci.com/gh/airtasker/spot/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/@airtasker/spot.svg)](https://npmjs.org/package/@airtasker/spot)
[![License](https://img.shields.io/npm/l/@airtasker/spot.svg)](https://github.com/airtasker/spot/blob/master/package.json)

<!-- toc -->
* [Spot](#spot)
* [Why we built Spot](#why-we-built-spot)
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
npx @airtasker/spot generate --contract api.ts
```

# Commands

<!-- commands -->
* [`spot checksum SPOT_CONTRACT`](#spot-checksum-spot_contract)
* [`spot docs SPOT_CONTRACT`](#spot-docs-spot_contract)
* [`spot generate`](#spot-generate)
* [`spot help [COMMAND]`](#spot-help-command)
* [`spot init`](#spot-init)
* [`spot lint SPOT_CONTRACT`](#spot-lint-spot_contract)
* [`spot mock SPOT_CONTRACT`](#spot-mock-spot_contract)
* [`spot test SPOT_CONTRACT`](#spot-test-spot_contract)
* [`spot validate SPOT_CONTRACT`](#spot-validate-spot_contract)

## `spot checksum SPOT_CONTRACT`

Generate a version tag based on a Spot contract

```
USAGE
  $ spot checksum SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ spot mock api.ts
```

_See code: [build/cli/src/commands/checksum.js](https://github.com/airtasker/spot/blob/v0.2.18/build/cli/src/commands/checksum.js)_

## `spot docs SPOT_CONTRACT`

Preview Spot contract as OpenAPI3 documentation. The documentation server will start on http://localhost:8080.

```
USAGE
  $ spot docs SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help       show CLI help
  -p, --port=port  [default: 8080] Documentation server port

EXAMPLE
  $ spot docs api.ts
```

_See code: [build/cli/src/commands/docs.js](https://github.com/airtasker/spot/blob/v0.2.18/build/cli/src/commands/docs.js)_

## `spot generate`

Runs a generator on an API. Used to produce client libraries, server boilerplates and well-known API contract formats such as OpenAPI.

```
USAGE
  $ spot generate

OPTIONS
  -c, --contract=contract    (required) Path to a TypeScript Contract definition
  -g, --generator=generator  Generator to run
  -h, --help                 show CLI help
  -l, --language=language    Language to generate
  -o, --out=out              Directory in which to output generated files

EXAMPLE
  $ spot generate --contract api.ts --language yaml --generator openapi3 --out output/
```

_See code: [build/cli/src/commands/generate.js](https://github.com/airtasker/spot/blob/v0.2.18/build/cli/src/commands/generate.js)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

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

_See code: [build/cli/src/commands/init.js](https://github.com/airtasker/spot/blob/v0.2.18/build/cli/src/commands/init.js)_

## `spot lint SPOT_CONTRACT`

Lint a Spot contract

```
USAGE
  $ spot lint SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ spot lint api.ts
```

_See code: [build/cli/src/commands/lint.js](https://github.com/airtasker/spot/blob/v0.2.18/build/cli/src/commands/lint.js)_

## `spot mock SPOT_CONTRACT`

Run a mock server based on a Spot contract

```
USAGE
  $ spot mock SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help                   show CLI help
  -p, --port=port              (required) [default: 3010] Port on which to run the mock server
  --pathPrefix=pathPrefix      Prefix to prepend to each endpoint path
  --proxyBaseUrl=proxyBaseUrl  If set, the server would act as a proxy and fetch data from the given remote server
                               instead of mocking it

EXAMPLE
  $ spot mock api.ts
```

_See code: [build/cli/src/commands/mock.js](https://github.com/airtasker/spot/blob/v0.2.18/build/cli/src/commands/mock.js)_

## `spot test SPOT_CONTRACT`

Test a Spot contract

```
USAGE
  $ spot test SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help                   show CLI help
  -s, --stateUrl=stateUrl      Base URL for state changes
  -t, --testFilter=testFilter  Filter by endpoint and test
  -u, --url=url                (required) Base URL
  --debug                      Enable debug logs
  --includeDraft               Include draft endpoint tests

EXAMPLES
  $ spot test api.ts -u http://localhost:3000
  $ spot test api.ts -u http://localhost:3000 -s http://localhost:3000/spot
  $ spot test api.ts -u http://localhost:3000 -t MyEndpoint:myTest
```

_See code: [build/cli/src/commands/test.js](https://github.com/airtasker/spot/blob/v0.2.18/build/cli/src/commands/test.js)_

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

_See code: [build/cli/src/commands/validate.js](https://github.com/airtasker/spot/blob/v0.2.18/build/cli/src/commands/validate.js)_
<!-- commandsstop -->

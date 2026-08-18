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

## Getting Started

Get started with writing Spot contracts - [Spot Guide](https://github.com/airtasker/spot/wiki/Spot-Guide)

For all available syntax, see [Spot Syntax](https://github.com/airtasker/spot/wiki/Spot-Syntax)

### Requirements

Either Docker, or:

- Node.js >= 18.12.0
- pnpm (recommended) or npm

### Installation

With [pnpm](https://pnpm.io/) installed and initialized add `@airtasker/spot` to your project:

```sh
pnpm add @airtasker/spot
```

You can pass the definition above to a generator by simply running:

```sh
pnpm exec spot generate --contract api.ts --generator openapi3 --language yaml --out doc/output
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
* [Releases](#releases)
<!-- tocstop -->

# Usage

Spot ships two ways, built from the same source at the same version.

- **The npm package `@airtasker/spot`** is published to npm and to GitHub Packages and
  is the distribution available to everyone. It is what you want for interactive local
  use, for the in-memory API below, and for the commands the image does not carry.
- **The Docker image `ghcr.io/airtasker/spot`** needs no Node toolchain and no
  `node_modules` beside your contracts, which suits a repository that is not otherwise
  a Node project. The package is **private to Airtasker** — if you are outside the
  organisation, use the npm package.

## Docker

```sh
docker run --rm --user "$(id -u):$(id -g)" \
  --volume "$PWD:$PWD" --workdir "$PWD" \
  ghcr.io/airtasker/spot:<version> \
  generate --contract api.ts --generator openapi3 --language yaml --out doc/output
```

`ghcr.io/airtasker/spot` is a private package. Authenticate once with a token carrying
`read:packages`:

```sh
echo "$GH_PACKAGES_READONLY_TOKEN" | docker login ghcr.io -u "$USER" --password-stdin
```

Substitute the release you want for `<version>`; the published tags are the full
version, the major and minor prefixes, and `latest` for the most recent non-prerelease.
Images are built for `linux/amd64` and `linux/arm64`.

### The invocation, argument by argument

Each part of the command above is doing something, and dropping one has consequences
that are not always loud:

| Argument | Why |
| --- | --- |
| `--volume "$PWD:$PWD"` | Mounts your workspace **at its real absolute path**. Spot passes path arguments to the filesystem unresolved, so mounting elsewhere makes relative paths resolve differently inside and outside the container. |
| `--workdir "$PWD"` | So `--contract api.ts` and `--out doc/output` mean what they mean at your shell. |
| `--user "$(id -u):$(id -g)"` | Output is owned by you rather than by the image's own user. Load-bearing wherever a build system reads Spot's output: an mtime cache or an incremental-build input on a file you cannot overwrite breaks it. |
| `--rm` | Nothing here is long-lived except `validation-server`, below. |

### Quiet failure modes

All of these produce a wrong result rather than an error:

- **An `--out` outside the mount** is written *inside* the container, so the file never
  appears on the host. Where the container user cannot write that path this fails
  loudly; where it can — anywhere under `/tmp`, which is the container's home — the
  command exits 0. Spot logs the absolute path it wrote to; check it against where you
  expected.
- **`--out ~/x`** is that writable case: the tilde expands against the **container's**
  home directory, not yours, so it succeeds and lands nowhere useful. Use a path under
  the mount.
- **Environment variables are not inherited** from your shell. Pass them with
  `--env`.
- **Omitting `--user`** writes output as the image's own unprivileged user rather than
  as you, which a later run as yourself may not be able to overwrite. Downstream builds
  that key a cache or an incremental task input on the output's mtime stall on this.

### Long-running: the validation server

```sh
docker run --rm --name spot-validation-server \
  --user "$(id -u):$(id -g)" \
  --volume "$PWD:$PWD" --workdir "$PWD" \
  --publish 5600:5600 \
  ghcr.io/airtasker/spot:<version> \
  validation-server api.ts -p 5600
```

The server binds all interfaces, so `--publish` reaches it. It prints

```
Validation server running on port 5600
```

on stdout, line-buffered and without needing a TTY, which is what a build system can
block on before it starts sending requests. `GET /health` answers once it is up.

Give it a `--name` and tear it down with `docker rm -f <name>` from a
`finally`-equivalent in whatever starts it, so an abnormally-exiting build does not
leave it running.

### What the image carries

| Command | In the image | Notes |
| --- | --- | --- |
| `generate` | yes | |
| `validate` | yes | |
| `lint` | yes | |
| `ts-lint` | yes | Formatting, lint and type checks for contract TypeScript, with the configuration bundled in |
| `checksum` | yes | |
| `validation-server` | yes | See above |
| `mock` | **no** | npm only — a long-running local development server |
| `docs` | **no** | npm only — a long-running local documentation server |
| `init` | **no** | npm only — scaffolds a project on your machine |

## npm

To get started and set up an API declaration in the current directory, run:

```
pnpm dlx @airtasker/spot init
```

You can then run a generator with:

```
pnpm exec spot generate --contract api.ts --generator openapi3 --language yaml --out doc/output
```

## In Memory Usage

```ts
import { Spot } from "@airtasker/spot";

const contract = Spot.parseContract("./api.ts");
const openApi = Spot.OpenApi3.generateOpenAPI3(contract);

console.log(openApi);

/*
{
  openapi: '3.0.2',
  info: { title: 'my-api', description: undefined, version: '0.0.0' },
  paths: { '/users': { post: [Object] } },
  components: {
    schemas: { CreateUserRequest: [Object], CreateUserResponse: [Object] },
    securitySchemes: undefined
  },
  security: undefined
}
*/
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
* [`spot validate SPOT_CONTRACT`](#spot-validate-spot_contract)
* [`spot validation-server SPOT_CONTRACT`](#spot-validation-server-spot_contract)

## `spot checksum SPOT_CONTRACT`

Generate a checksum for a Spot contract

```
USAGE
  $ spot checksum SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ spot checksum api.ts
```

_See code: [build/cli/src/commands/checksum.js](https://github.com/airtasker/spot/blob/v2.0.3/build/cli/src/commands/checksum.js)_

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

_See code: [build/cli/src/commands/docs.js](https://github.com/airtasker/spot/blob/v2.0.3/build/cli/src/commands/docs.js)_

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

_See code: [build/cli/src/commands/generate.js](https://github.com/airtasker/spot/blob/v2.0.3/build/cli/src/commands/generate.js)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.3.1/src/commands/help.ts)_

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

_See code: [build/cli/src/commands/init.js](https://github.com/airtasker/spot/blob/v2.0.3/build/cli/src/commands/init.js)_

## `spot lint SPOT_CONTRACT`

Lint a Spot contract

```
USAGE
  $ spot lint SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help                                                     show CLI help
  --has-discriminator=(error|warn|off)                           Setting for has-discriminator
  --has-request-payload=(error|warn|off)                         Setting for has-request-payload
  --has-response=(error|warn|off)                                Setting for has-response
  --has-response-payload=(error|warn|off)                        Setting for has-response-payload
  --no-inline-objects-within-unions=(error|warn|off)             Setting for no-inline-objects-within-unions
  --no-nullable-arrays=(error|warn|off)                          Setting for no-nullable-arrays
  --no-nullable-fields-within-request-bodies=(error|warn|off)    Setting for no-nullable-fields-within-request-bodies
  --no-omittable-fields-within-response-bodies=(error|warn|off)  Setting for no-omittable-fields-within-response-bodies
  --no-trailing-forward-slash=(error|warn|off)                   Setting for no-trailing-forward-slash

EXAMPLES
  $ spot lint api.ts
  $ spot lint --has-descriminator=error
  $ spot lint --no-nullable-arrays=off
```

_See code: [build/cli/src/commands/lint.js](https://github.com/airtasker/spot/blob/v2.0.3/build/cli/src/commands/lint.js)_

## `spot mock SPOT_CONTRACT`

Run a mock server based on a Spot contract

```
USAGE
  $ spot mock SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help                                   show CLI help
  -p, --port=port                              (required) [default: 3010] Port on which to run the mock server
  --pathPrefix=pathPrefix                      Prefix to prepend to each endpoint path

  --proxyBaseUrl=proxyBaseUrl                  If set, the server will act as a proxy and fetch data from the given
                                               remote server instead of mocking it

  --proxyFallbackBaseUrl=proxyFallbackBaseUrl  Like proxyBaseUrl, except used when the requested API does not match
                                               defined SPOT contract. If unset, 404 will always be returned.

  --proxyMockBaseUrl=proxyMockBaseUrl          Like proxyBaseUrl, except used to proxy draft endpoints instead of
                                               returning mocked responses.

EXAMPLE
  $ spot mock api.ts
```

_See code: [build/cli/src/commands/mock.js](https://github.com/airtasker/spot/blob/v2.0.3/build/cli/src/commands/mock.js)_

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

_See code: [build/cli/src/commands/validate.js](https://github.com/airtasker/spot/blob/v2.0.3/build/cli/src/commands/validate.js)_

## `spot validation-server SPOT_CONTRACT`

Start the spot contract validation server

```
USAGE
  $ spot validation-server SPOT_CONTRACT

ARGUMENTS
  SPOT_CONTRACT  path to Spot contract

OPTIONS
  -h, --help       show CLI help
  -p, --port=port  [default: 5907] The port where application will be available

EXAMPLE
  $ spot validation-server api.ts
```

_See code: [build/cli/src/commands/validation-server.js](https://github.com/airtasker/spot/blob/v2.0.3/build/cli/src/commands/validation-server.js)_
<!-- commandsstop -->

# Releases

When we're ready for a new release, following steps in the [Wiki](https://github.com/airtasker/spot/wiki/Releasing-Spot)

Publishing the GitHub Release is the only trigger, and it starts the npm publish, the
GitHub Packages copy, and the `ghcr.io/airtasker/spot` image build — so there is no
second thing to remember.

They run in parallel and can fail independently: one registry can end up with a version
another does not have. The image build is the more likely of the two to fail, because it
builds arm64 under emulation. If a release lands on npm but not on ghcr, re-run the
`docker-publish` job rather than cutting a new version.

This repository is public, which means the ghcr package defaults to public visibility
the first time it is pushed. `ghcr.io/airtasker/spot` is deliberately **private**:
check its visibility, and the read access granted to consuming repositories, after any
change that could recreate the package.

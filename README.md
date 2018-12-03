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

- [Usage](#usage)
- [Commands](#commands)
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

## `@api`

Define an API. This is required and must only be defined once:

```TypeScript
import { api } from "@airtasker/spot";

@api({
  name: "My API",
  description: "My really cool API"
})
class MyAPI {}
```

| Field           | Description            |
| --------------- | ---------------------- |
| `name`\*        | Name of the API        |
| `description`\* | Description of the API |

## `@endpoint`

Define a HTTP endpoint for the API. An endpoint describes an action on a particular path:

```TypeScript
import { endpoint, genericError, header, pathParam, queryParam, request, response, specificError } from "@airtasker/spot";

class MyUserEndpoints {
  @endpoint({
    method: "GET",
    path: "/users",
    description: "Retrieve all users",
    tags: ["Users"]
  })
  getUsers(@queryParam({ description: "Search term" }) search_term: string): UserResponse[] {
    return response();
  }

  @endpoint({
    method: "GET",
    path: "/users/:id",
    description: "Get user by id",
    tags: ["Users"]
  })
  getUser(@pathParam({ description: "User unique identifier" }) id: string): UserResponse {
    return response();
  }

  @endpoint({
    method: "POST",
    path: "/users",
    description: "Create a user",
    tags: ["Users"]
  })
  @specificError<ApiError>({
    name: "unauthorized",
    statusCode: 401
  })

  createUser(
    @request req: CreateUserRequest,
    @header({
      name: "Authorization",
      description: "This is the authorization token"
    })
    authToken: Optional<string>
  ): CreateUserResponse {
    return response();
  }
}

interface UserResponse {
  firstName: string;
  lastName: string;
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
}

interface CreateUserResponse {
  success: boolean;
}

interface ApiError {
  message: string;
}
```

| Field                | Default            | Description                                               |
| -------------------- | ------------------ | --------------------------------------------------------- |
| `method`\*           |                    | [HTTP method](#suppported-http-methods)                   |
| `path`\*             |                    | URL path                                                  |
| `description`        | `""`               | Description of the endpoint                               |
| `requestContentType` | `application/json` | Content type of the request body                          |
| `successStatusCode`  | `200`              | HTTP status code for a successful response                |
| `tags`               |                    | Array of tags used for endpoint grouping in documentation |

### `@request`

Define a request body.

### `@header`

Define a request header. `@header` can be used multiple times to define multiple headers.

| Field         | Description               |
| ------------- | ------------------------- |
| `name`\*      | Name of the header        |
| `description` | Description of the header |

### `@pathParam`

Define path parameters that appear in the `@endpoint.path`. The parameter must be defined in the `@endpoint.path`. A `@pathParam` should be defined for each parameter defined in `@endpoint.path`.

| Field         | Description                       |
| ------------- | --------------------------------- |
| `description` | Description of the path parameter |

### `@queryParam`

Define query parameters. `@queryParam` can be used multiple times to define multiple query parameters.

| Field         | Description                        |
| ------------- | ---------------------------------- |
| `description` | Description of the query parameter |

### `@specificError<T>`

Define a known error for the endpoint. `@specificError` can be used multiple times to define multiple errors.

| Field          | Description                    |
| -------------- | ------------------------------ |
| `name`\*       | Name of the error              |
| `statusCode`\* | HTTP status code for the error |

### `@genericError<T>`

Define a default error for the endpoint. This can only be used once for an `@endpoint`.

## Matcher Types

| Type          | Description                                                                                             | Example                                                |
| ------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `string`      | A string value                                                                                          |
| `number`      | A number value                                                                                          |
| `Int32`       | A 32-bit integer                                                                                        |
| `Int64`       | A 64-bit integer                                                                                        |
| `Float`       | A 32-bit floating point number                                                                          |
| `Double`      | A 64-bit floating point number                                                                          |
| `boolean`     | A boolean value                                                                                         |
| `Date`        | [ISO-8601](https://www.iso.org/iso-8601-date-and-time-format.html) string representation of a date      |
| `DateTime`    | [ISO-8601](https://www.iso.org/iso-8601-date-and-time-format.html) string representation of a date-time |
| Constant      | An exact value                                                                                          | `role: "admin"`                                        |
| `Optional<T>` | An optional value                                                                                       | `role: Optional<string>`                               |
| Union         | One-of                                                                                                  | `role: "admin" \| "member"`, `param: string \| number` |
| Array         | Collection                                                                                              | `nicknames: string[]`                                  |
| Object        | An object matcher                                                                                       | `person: { firstName: string, lastName: string }`      |

## Suppported HTTP Methods

`GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH`

# Commands

<!-- commands -->

- [`spot generate`](#spot-generate)
- [`spot help [COMMAND]`](#spot-help-command)
- [`spot init`](#spot-init)

## `spot generate`

Runs a generator on an API. Used to produce client libraries, server boilerplates and well-known API contract formats such as OpenAPI.

```
USAGE
$ spot generate

OPTIONS
-a, --api=api (required) Path to a TypeScript API definition
-g, --generator=generator Generator to run
-h, --help show CLI help
-l, --language=language Language to generate
-o, --out=out Directory in which to output generated files

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
COMMAND command to show help for

OPTIONS
--all see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.3/src/commands/help.ts)_

## `spot init`

Generates the boilerplate for an API.

```
USAGE
$ spot init

OPTIONS
-h, --help show CLI help

EXAMPLE
$ spot init
Generated the following files:

- api.ts
- tsconfig.json
- package.json
```

_See code: [cli/src/commands/init.js](https://github.com/airtasker/spot/blob/master/cli/src/commands/init.ts)_

<!-- commandsstop -->

```

```

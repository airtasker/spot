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

| Field         | Description                           |
| ------------- | ------------------------------------- |
| `name`        | (**required**) Name of the API        |
| `description` | (**required**) Description of the API |

## `@endpoint`

Define a HTTP endpoint for the API. An endpoint describes a particular HTTP action on a URL path:

```TypeScript
import { endpoint, header, pathParam, queryParam, request, response, specificError } from "@airtasker/spot";

class MyUserEndpoints {
  // GET /users expects a mandatory `search_term` query parameter and returns a list of users.
  @endpoint({
    method: "GET",
    path: "/users",
    description: "Retrieve all users",
    tags: ["Users"]
  })
  getUsers(@queryParam({ description: "Search term" }) search_term: Optional<string>): UserResponse[] {
    return response();
  }

  // GET /users/:id returns a user by their unique identifier.
  @endpoint({
    method: "GET",
    path: "/users/:id",
    description: "Get user by id",
    tags: ["Users"]
  })
  getUser(@pathParam({ description: "Unique user identifier" }) id: string): UserResponse {
    return response();
  }

  // POST /users creates a user, expecting an authorization token to be present.
  @endpoint({
    method: "POST",
    path: "/users",
    description: "Create a user",
    tags: ["Users"]
  })
  @specificError<ApiErrorResponse>({
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

interface User {
  firstName: string;
  lastName: string;
}

type UserResponse = User;
type UserListResponse = User[];

interface CreateUserRequest {
  firstName: string;
  lastName: string;
}

interface CreateUserResponse {
  success: boolean;
}

interface ApiErrorResponse {
  message: string;
}
```

| Field                | Default            | Description                                              |
| -------------------- | ------------------ | -------------------------------------------------------- |
| `method`             |                    | (**required**) [HTTP method](#suppported-http-methods)   |
| `path`               |                    | (**required**) URL path                                  |
| `description`        | `""`               | Description of the endpoint                              |
| `requestContentType` | `application/json` | Content type of the request body                         |
| `successStatusCode`  | `200`              | HTTP status code for a successful response               |
| `tags`               |                    | List of tags used for endpoint grouping in documentation |

### `@request`

Define a request body for requests that require one. This is commonly used for `POST` and `PUT` requests and is not allowed for `GET` requests:

```TypeScript
class MyUserEndpoints {
  //...
  @endpoint({
    method: "POST",
    path: "/users"
  })
  createUser(
    @request req: CreateUserRequest
  ): UserResponse {
    return response();
  }

  @endpoint({
    method: "PUT",
    path: "/users/:id"
  })
  updateUser(
    @pathParam({ description: "User unique identifier" }) id: string,
    @request req: UpdateUserRequest
  ): UserResponse {
    return response();
  }
  //...
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
}

interface UpdateUserRequest {
  lastName: string;
}
```

### `@header`

Define a request header. `@header` can be used multiple times to define multiple headers:

```TypeScript
  //...
  @endpoint({
    method: "POST",
    path: "/users",
    description: "Create a user"
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
  //...
```

| Field         | Description                       |
| ------------- | --------------------------------- |
| `name`        | (**required**) Name of the header |
| `description` | Description of the header         |

### `@pathParam`

Define path parameters that appear in the `path` provided in `@endpoint()`. For example if the path is `/users/:id`, the endpoint method must define a matching argument with `@pathParam() id: string`::

```TypeScript
  //...
  @endpoint({
    method: "GET",
    path: "/users/:id",
    description: "Get user by id"
  })
  getUser(@pathParam({ description: "Unique user identifier" }) id: string): UserResponse {
    return response();
  }
  //...
```

**Note**: the name of the argument must match the name of the path parameter.

| Field         | Description                       |
| ------------- | --------------------------------- |
| `description` | Description of the path parameter |

### `@queryParam`

Define query parameters. `@queryParam` can be used multiple times to define multiple query parameters:

```TypeScript
  //...
  @endpoint({
    method: "GET",
    path: "/users",
    description: "Retrieve all users"
  })
  getUsers(@queryParam({ description: "Search term" }) search_term: Optional<string>): UserResponse[] {
    return response();
  }
  //...
```

**Note**: the name of the argument must match the name of the query parameter.

| Field         | Description                        |
| ------------- | ---------------------------------- |
| `description` | Description of the query parameter |

### `@specificError<T>`

Define a known error for the endpoint. `@specificError` can be used multiple times to define multiple errors. `T` must be replaced with the response type when the error occurs, for example `@specificError<UnauthorizedErrorResponse>`:

```TypeScript
  //...
  @endpoint({
    method: "POST",
    path: "/users",
    description: "Create a user"
  })
  @specificError<UnauthorizedErrorResponse>({
    name: "unauthorized",
    statusCode: 401
  })
  createUser(
    //...
  ): CreateUserResponse {
    return response();
  }
  //...
```

| Field        | Description                                   |
| ------------ | --------------------------------------------- |
| `name`       | (**required**) Name of the error              |
| `statusCode` | (**required**) HTTP status code for the error |

### `@genericError<T>`

Define a default error for the endpoint. This can only be used once for an `@endpoint`. `T` must be replaced with the response type when the error occurs, for example `@genericError<ApiErrorResponse>`:

```TypeScript
  //...
  @endpoint({
    method: "POST",
    path: "/users",
    description: "Create a user"
  })
  @genericError<ApiErrorResponse>()
  createUser(
    //...
  ): CreateUserResponse {
    return response();
  }
  //...
```

## Matcher Types

| Type          | Description                                                                                             | Example                                                |
| ------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `string`      | A string value                                                                                          | `name: string`                                         |
| `number`      | A number value                                                                                          | `numPencils: number`                                   |
| `Int32`       | A 32-bit integer                                                                                        | `age: Int32`                                           |
| `Int64`       | A 64-bit integer                                                                                        | `numAtoms: Int64`                                      |
| `Float`       | A 32-bit floating point number                                                                          | `weight: Float`                                        |
| `Double`      | A 64-bit floating point number                                                                          | `price: Double`                                        |
| `boolean`     | A boolean value                                                                                         | `isAdmin: boolean`                                     |
| `Date`        | [ISO-8601](https://www.iso.org/iso-8601-date-and-time-format.html) string representation of a date      | `dateOfBirth: Date`                                    |
| `DateTime`    | [ISO-8601](https://www.iso.org/iso-8601-date-and-time-format.html) string representation of a date-time | `createdAt: DateTime`                                  |
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

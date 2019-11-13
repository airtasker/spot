# Linting

Spot linters are a set of functions whose goal is to ensure a contract definition conforms with our API guidelines. In other words, linters check whether or not a contract is semantically correct.

Linting rules can be found in files inside the spot directory (under [lib/src/linting](lib/src/linting). Each file corresponds to a specific rule and holds the logic to validate a subset of a contract (e.g. headers definition, request/response types, etc).

## Anatomy of a linting rule

Let's take an example of a linting rule to demonstrate how we can catch semantic errors in a given contract  :

```typescript
export const hasDiscriminator: LintingRule = contract => {
  const topLevelTypes = flatten([
    ...contract.types,
    ...contract.endpoints.map(extractEndpointTypes)
  ]);
  const unionTypes = flatten(
    topLevelTypes.map(t => extractNestedUnionTypes(t, contract.types))
  ); // Grab and parse all the union types defined in the contract
  return unionTypes
    .filter(negate(isUnionOfSingleTypeWithNull))
    .filter(negate(isUnionOfStringLiterals))
    .filter(
      typeNode => inferDiscriminator(contract.types, typeNode.type) === null
    ) // Filter out unions which don't have a discriminator 
    .map(typeNode => ({
      message: `The type \`${typeNode.name}\` doesn't have a discriminator`
    })); };
```

This piece of code reveals the logic which checks that all union types defined in a contract have a discriminator.

To do so, we define a function that takes an in-memory representation of a contract as input and iterates over its nodes. The contract passed in parameters is an AST-like object that holds all the nodes that compose a contract (i.e. endpoints, parameters, types, etc).

As we use JavaScript, the main data structures we leverage are objects and arrays. Objects can be used to describe nodes such as endpoints or types. Arrays are mainly used for composition and therefore to define collections of nodes (e.g. list of endpoints, list of types, etc).

Refer to [lib/src/models/nodes.ts](lib/src/linting/rules) to find out all the internal types Spot to represent a contract object.

## Write a linting rule

Create a new file inside lib/src/linting/rules and give it a name that reflects what the rule is supposed to verify (see API guidelines)

In that file, create a new function with the same name as the file newly created (in camelCase)  e.g.

```typescript
const lintingRuleName: LintingRule = contract  => {
}
```

The function takes a contract object as input and is expected to return a list of violations, as follows:

```typescript
interface LintingRuleViolation {
  message: string;
  source?: Locatable<unknown>;
}

const lintingRuleName: LintRules =contract => {
    // Iterate over and filter contract nodes that don't conform to the given   API guideline
    const filteredNodes = contract.types.map(...) // .filter() .find(), .etc

    return filteredNodes.map(node => ({
        message: "..." // mismatch on current node
    }));
}
```

Writing logic for a linter consists in parsing a contract and recursively traversing its nodes to search for inconsistencies.

Then, open  lib/src/linting/rules.ts, import the previous function from your linting rule file and add it to the hash of linting rules, so it can be applied when the linter is run.

Something along the lines of:

```typescript
import { hasDiscriminator } from "./rules/has-discriminator";
import { hasRequestPayload } from "./rules/has-request-payload";
import { hasResponsePayload } from "./rules/has-response-payload";
import { noNestedTypesWithinUnions } from "./rules/no-nested-types-within-unions";
import { noNullableArrays } from "./rules/no-nullable-arrays";
import { noNullableFieldsWithinRequests } from "./rules/no-nullable-fields-within-requests";
import { noObjectsInQueryParams } from "./rules/no-objects-in-query-params";
import { noOmittableFieldsWithinResponses } from "./rules/no-omittable-fields-within-responses";
import { oneSuccessResponsePerEndpoint } from "./rules/one-success-response-per-endpoint";
import { yourLintingRuleName } from "./your-linting-rule-name";

export const availableRules = {
  "has-discriminator": hasDiscriminator,
  "has-request-payload": hasRequestPayload,
  "has-response-payload": hasResponsePayload,
  "no-nested-types-within-unions": noNestedTypesWithinUnions,
  "no-nullable-arrays": noNullableArrays,
  "no-nullable-fields-within-requests": noNullableFieldsWithinRequests,
  "no-objects-in-query-params": noObjectsInQueryParams,
  "no-omittable-fields-within-responses": noOmittableFieldsWithinResponses,
  "one-success-response-per-endpoint": oneSuccessResponsePerEndpoint
  "yourLintingRuleName": yourLintingRuleName
};

export type RuleName = keyof typeof availableRules;
```

To run the linter against a contract, simply do

```
$ ./bin/run lint [contract].ts
```

## Test a linting rule

Testing a linting rule is necessary. It allows to ensure it works as expected and comply with the guidelines.

Every linting rule comes with a specification file. Writing tests for a specific rule consists in creating contracts inputs and programmatically call the function associated with this rule.

### Create a specs file

Create a new file in the same directory and name it {ruleName}.spec.ts.

### Set up imports and tests cases

The content of a test file should look like :

```typescript
import { HttpMethod } from "../../models/http";
import {
  ApiNode,
  BodyNode,
  DefaultResponseNode,
  EndpointNode,
  RequestNode,
  ResponseNode
} from "../../models/nodes";
import {
  arrayType,
  NULL,
  objectType,
  STRING,
  stringLiteral,
  unionType
} from "../../models/types";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { yourLintingRuleName } from "./your-linting-rule-name";

describe("rule: your-linting-rule-name", () => {
test("valid for correct usage", () => { } });
```

### Write test cases

In every test case, we instantiate a mock contract and call the linting function with it :

```typescript
test("valid for correct usage", () => {

 const mockContract = {
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: "createUser",
          method: fakeLocatable<HttpMethod>("POST"),
          path: "/users",
          isDraft: false,
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: unionType([
                objectType([
                  {
                    name: "type",
                    optional: false,
                    type: stringLiteral("user")
                  }
                ]),
                objectType([
                  {
                    name: "type",
                    optional: false,
                    type: stringLiteral("admin")
                  }
                ])
              ])
            })
          }),
          tests: [],
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(200),
              body: fakeLocatable<BodyNode>({
                type: unionType([
                  objectType([
                    {
                      name: "type",
                      optional: false,
                      type: stringLiteral("user")
                    }
                  ]),
                  objectType([
                    {
                      name: "type",
                      optional: false,
                      type: stringLiteral("admin")
                    }
                  ])
                ])
              })
            })
          ]
        })
      ],
      types: []
    });

    yourLintingRuleName(mockContract);
}
```

Usually the first test case ensures a contract is valid. The following test cases would focus on finding mismatches and intentionally set up invalid mock contracts to trigger lint errors.

Writing such logic requires to be familiar with the data structures used in Spot to express contract data :

`Nodes`: they represent entities in a contract i.e. Endpoints, Requests, Responses,  Requests Bodies, HttpMethod etc.

`fakeLocatable<T>`: this function is used to instantiate a Node of type T (generic) e.g. `fakeLocatable<BodyNode>`

`Types`: contracts are strongly typed. This ensures that requests and responses inputs are valid by matching contract types definitions.

You can use the following functions to build types definitions when creating a mock contract :

`unionType(types: DataType[])`: produces a union type and allow to define inputs that can be of multiple types e.g. ObjectA | ObjectB

`objectType(properties: ObjecTypeProperty[])`: produces a hash type definition given a list of keys passed in parameters.

`arrayType(elementType: DataType)`: produces a type that defines a collection of items.

Primitive types can be simply represented by using the following structure :

```typescript
{
    type: {
        kind: TypeKind.STRING // TypeKind.STRING can be replaced by any other types defined in the TypeKinds enum
    }
}
```

List of supported types - TypeKinds enum [lib/src/models/types/kinds.ts](lib/src/models/types/kinds.ts)

# Linting

Spot linters are a set of functions whose goal is to ensure a contract definition conforms with our API guidelines.

Linting rules can be found in files inside the spot directory (under [lib/src/neu/linting/rules](/lib/src/neu/linting/rules). Each file corresponds to a specific rule and holds the logic to validate a subset of a contract (e.g. headers definition, request/response types, etc).

## Anatomy of a linting rule

Let's take an example of a linting rule to demonstrate how we can catch errors in a given contract:

```typescript
export function hasResponse(contract: Contract): LintingRuleViolation[] {
  const violations: LintingRuleViolation[] = [];

  contract.endpoints
    .filter(
      endpoint =>
        endpoint.responses.length === 0 &&
        endpoint.defaultResponse === undefined
    )
    .forEach(endpoint => {
      violations.push({
        message: `Endpoint (${endpoint.name}) does not declare any response`
      });
    });

  return violations;
}
```

This piece of code reveals the logic which checks that all endpoints define at least one response.

To do so, we define a function that takes an in-memory representation of a contract as input and iterates over its nodes. The contract passed in parameters is an AST-like object that holds all the nodes that compose a contract (i.e. endpoints, parameters, types, etc).

As we use JavaScript, the main data structures we leverage are objects and arrays. Objects can be used to describe nodes such as endpoints or types. Arrays are mainly used for composition and therefore to define collections of nodes (e.g. list of endpoints, list of types, etc).

Refer to [lib/src/neu/definitions.ts](lib/src/neu/definitions.ts) to find out all the internal types Spot uses to represent a contract object.

## Write a linting rule

Create a new file inside `lib/src/neu/linting/rules` and give it a name that reflects what the rule is supposed to verify (see API guidelines)

In that file, create a new function with the same name as the file newly created (in camelCase) e.g.

```typescript
export function lintingRuleName(contract: Contract): LintingRuleViolation[] { ... }
```

The function takes a contract object as input and is expected to return a list of violations, as follows:

```typescript
interface LintingRuleViolation {
  message: string;
}
```

Writing logic for a linter requires parsing a contract and recursively traversing its nodes to search for inconsistencies.

Then, open `lib/src/neu/linting/rules.ts`, import the previous function from your linting rule file and add it to the hash of linting rules, so it can be applied when the linter is run.

Something along the lines of:

```typescript
import { hasDiscriminator } from "./rules/has-discriminator";
import { hasRequestPayload } from "./rules/has-request-payload";
import { hasResponse } from "./rules/has-response";
import { hasResponsePayload } from "./rules/has-response-payload";
import { noInlineObjectsWithinUnions } from "./rules/no-inline-objects-within-unions";
import { noNullableArrays } from "./rules/no-nullable-arrays";
import { noNullableFieldsWithinRequestBodies } from "./rules/no-nullable-fields-within-request-bodies";
import { noOmittableFieldsWithinResponseBodies } from "./rules/no-omittable-fields-within-response-bodies";
import { yourNewLintingRuleName } from "./your-new-linting-rule-name";

export const availableRules: LintingRules = {
  "has-discriminator": hasDiscriminator,
  "has-request-payload": hasRequestPayload,
  "has-response-payload": hasResponsePayload,
  "has-response": hasResponse,
  "no-inline-objects-within-unions": noInlineObjectsWithinUnions,
  "no-nullable-arrays": noNullableArrays,
  "no-nullable-fields-within-request-bodies": noNullableFieldsWithinRequestBodies,
  "no-omiitable-fields-within-response-bodies": noOmittableFieldsWithinResponseBodies,
  "you-new-linting-rule-name": yourNewLintingRuleName
};
```

To run the linter against a contract, prepare the CLI:

```
$ yarn prepack
```

Then run:

```
$ ./bin/run lint [contract].ts
```

## Test a linting rule

Testing a linting rule is necessary. It makes sure everything works as expected and complies with the guidelines.

Every linting rule comes with a specification file. Writing tests for a specific rule consists in creating contracts inputs and programmatically calling the function associated with this rule.

### Create a spec file

Create a new file in the same directory and name it {ruleName}.spec.ts.

### Set up imports and tests cases

The content of a test file should look like:

```typescript
...
import { yourNewLintingRuleName } from "./your-new-linting-rule-name";

describe("rule: your-new-linting-rule-name", () => {
test("valid for correct usage", () => { ... } });
```

### Writing test cases

In every test case, we create an example contract representing the scenarios:

```typescript
// lib/src/neu/linting/rules/__spec-examples__/your-new-linting-rule-name/your-scenario.ts

import { api, body, defaultResponse, endpoint, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class Endpoint {
  @defaultResponse
  defaultResponse(@body body: Body) {}
}

interface Body {
  body: String;
}
```

Then we prepare the contract and run the linting rule:

```typescript
test("returns violations for your scenario", () => {
  const file = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/your-new-linting-rule-name/your-scenario.ts`
  ).file;

  const { contract } = parseContract(file).unwrapOrThrow();

  const result = hasResponse(contract);

  expect(result).toHaveLength(1);
  expect(result[0].message).toEqual("Some message");
});
```

Usually the first test case ensures a contract is valid. The following test cases would focus on finding linting violations and intentionally set up contracts to trigger lint errors.

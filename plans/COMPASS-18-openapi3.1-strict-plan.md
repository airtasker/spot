# COMPASS-18 — strict OpenAPI 3.1 output mode for SPOT

**Jira:** [COMPASS-18](https://airtasker.atlassian.net/browse/COMPASS-18)
**Baseline:** `airtasker/spot` @ `95c90f0` (v2.1.0)
**Written:** 2026-10-08

**Inputs:** These sit outside this repo, so this plan restates what it relies on.

- `COMPASS-17.spot-invalid-openapi3-yaml-findings.md` — the defects in the output.
- `COMPASS-17-spot-openapi3-root-cause-analysis.md` — the audit at source level.
- `COMPASS-18-openapi3-spec-compliance-plan.md` — the earlier plan for this ticket. Its Phase 0 measurements are reused here. Its in-place 3.0 fixes are superseded; see *Decisions*.

## Context

`spot generate -g openapi3` emits OpenAPI **3.0.2**. Five defects are known. Counts are for `bff-client`'s contract, re-derived on 2026-08-17:

| # | Defect | Emitted at (`lib/src/generators/openapi3/`) | Sites |
|---|---|---|---:|
| 1 | `nullable: true` beside a `$ref`. The spec ignores it. | `openapi3-type-util.ts` `referenceTypeToSchema` | 397 |
| 2 | `nullable` beside `oneOf` + `discriminator` with no `type`. It has no effect. | `openapi3-type-util.ts` `unionTypeToSchema` | 4 |
| 3 | In a nested union, the discriminator mapping and `oneOf` point at the intermediate wrapper schema, which has no `propertyName`. | `openapi3-type-util.ts` `unionTypeToDiscriminatorObject` | 2 unions, 4 values |
| 4 | Empty objects accept any object. This is valid; it is a contract-design question. | `openapi3-type-util.ts` `objectTypeToSchema` | 57 |
| 5 | `nullable` beside `allOf` with no `type`. It has no effect. | `openapi3-type-util.ts` `intersectionTypeToSchema` | 0 |

**The current output must not change.** `airtasker/openapi-generators` and the mobile and web clients it produces read the non-conformant shapes deliberately. Changing the current output breaks them.

**Goal:** add an **opt-in** generator, `spot generate -g openapi3.1`.

- It emits OpenAPI 3.1, whose schemas are JSON Schema 2020-12.
- The output conforms strictly to the spec, and every run checks this.

**First consumer:** the TypeScript client from [openapi-generator](https://openapi-generator.tech/), used by the new React Native marketplace app in `airtasker/monorepo`. That client has to run on React Native, in a browser and on Node.

**Lifespan:** SPOT is expected to remain in use for about six months and then retire. The design favours an independent, low-risk module over refactoring shared code.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Relationship to the earlier COMPASS-18 plan | **Supersedes** its in-place 3.0 fixes (its Phases 2–3) | Those fixes change the current output, which this plan freezes. |
| OpenAPI version | **3.1**, with `openapi: "3.1.0"` unless Phase 0 settles on `3.1.1` | 3.1 can express "or null" without ambiguity, which fixes findings 2 and 5. No 3.0 encoding does that for every reader. 3.2 support in swagger-parser, which openapi-generator depends on, is unconfirmed ([swagger-parser#2248](https://github.com/swagger-api/swagger-parser/issues/2248)). SPOT needs no feature that 3.2 added. |
| CLI surface | New generator key **`openapi3.1`** | Generators are selected by key from the registry in `cli/src/commands/generate.ts`. `openapi3` stays untouched. |
| Code shape | Independent module `lib/src/generators/openapi3-1/` | It needs no edits to `generators/openapi3/`, `lib/src/types.ts` or `lib/src/parsers/`. Duplication is accepted given the lifespan. |
| Nested discriminated unions | Flatten to the leaves: the outer `oneOf` and the `mapping` both list the leaf refs | The earlier Phase 0 showed this clears the validator. Moving only the mapping, without `oneOf`, breaks Kotlin codegen. Leaf refs are also the shape that codegen handles best. |
| Legacy `@oaSchemaProp` values | Convert them | Contracts need no edits to adopt the new mode. |
| Conformance | The output is checked at generate time, and generation fails on any violation | "Strict" becomes a guarantee rather than something only the tests check. |
| Current `openapi3` generator | Frozen. A hash test guards its output. | Backwards compatibility. |

Out of scope:

- Finding 4.
- Wiring the client into the monorepo (a follow-up ticket).
- Any change to `openapi-generators`.

## Emission rules

`withNull(s)` means:

- If `s` carries `type` and none of `$ref`, `oneOf`, `anyOf` or `allOf`: widen `type` to `[type, "null"]`, and append `null` to `enum` if `s` has one.
- Otherwise: emit `{ anyOf: [s, { type: "null" }] }`. Schemaprops that belong to the union stay on the outer schema.

| IR (`lib/src/types.ts` `TypeKind`) | Non-null | `X \| null` |
|---|---|---|
| `NULL` alone | `{type: "null"}`. The current generator throws here; see open question 2. | — |
| `BOOLEAN` | `{type: "boolean"}` | `{type: ["boolean", "null"]}` |
| `STRING` | `{type: "string"}` | `{type: ["string", "null"]}` |
| `DATE` / `DATE_TIME` | `{type: "string", format: "date" \| "date-time"}` | `type: ["string", "null"]`, format kept |
| `FLOAT` / `DOUBLE` | `{type: "number", format: "float" \| "double"}` | `type: ["number", "null"]`, format kept |
| `INT32` / `INT64` | `{type: "integer", format: "int32" \| "int64"}` | `type: ["integer", "null"]`, format kept |
| Literals | `{type: T, enum: [v]}`. Formats match the current generator. Use `enum`, not `const`, because codegen handles it better. | `{type: [T, "null"], enum: [v, null]}` |
| Union of literals of one kind | `{type: T, enum: [...]}` | `{type: [T, "null"], enum: [..., null]}` |
| `OBJECT` | `{type: "object", properties, required}` plus schemaprops | `type: ["object", "null"]` |
| `ARRAY` | `{type: "array", items}` | `type: ["array", "null"]` |
| `REFERENCE` | `{$ref: "#/components/schemas/N"}` | `{anyOf: [{$ref}, {type: "null"}]}`. If the target already admits null, emit a bare `{$ref}`. |
| Union with a discriminator | `{oneOf: [leaf refs], discriminator: {propertyName, mapping → leaf refs}}` | `{anyOf: [{oneOf, discriminator}, {type: "null"}]}` |
| Union with a discriminator, where an inner referenced union contains `null` | Lift the null to the outer level. The schema becomes the nullable form in the row above. | same |
| Union without a discriminator | `{oneOf: [...]}` | Add a `{type: "null"}` member, unless a member already admits null. |
| `INTERSECTION` | `{allOf: [...]}` plus schemaprops | `{anyOf: [{allOf}, {type: "null"}]}` |

### The `null` branch

- **It never sits inside a discriminated `oneOf`.** A `{type: "null"}` member has no `propertyName`, which breaks the discriminator rules. The earlier Phase 0 also showed that it aborts validation.
- **Nullable references use `anyOf`, not `oneOf`.** When the target already admits null, a `null` value matches both branches, and `oneOf` then rejects it. Phase 0 confirms that openapi-generator gives the same TypeScript for both keywords.

### `description` beside `$ref`

3.1 allows annotations beside `$ref`, so emit them at both component level and property level. The current generator drops them in `openapi3.ts` (component descriptions) and in `objectTypeToSchema` (property descriptions). Phase 0 checks that openapi-generator does not turn `$ref` plus a sibling into an extra wrapper model.

### Document level

- Set `openapi: "3.1.0"` (the current generator hard-codes `"3.0.2"` in `openapi3.ts`).
- Omit `jsonSchemaDialect`, so the OAS default dialect applies.
- Everything else is the same as `openapi3.ts`: paths, parameters with query `style`/`explode`, request bodies, responses, headers, security, servers, and examples maps.

### Facts about the IR that the rules depend on

All of these were checked against the tree at the baseline commit.

- **There is no Map or index-signature type.** The parser rejects them in `lib/src/parsers/type-parser.ts`. The only open-object form is the boolean schemaprop `additionalProperties`.
- **References never carry schemaprops** (`isSchemaPropAllowedType` in `lib/src/types.ts`).
- **Unions and intersections can carry only `deprecated`, `example` and `title`** (`lib/src/parsers/schemaprop-parser.ts`).
- **Discriminators are inferred by the parser, never written by authors.** The parser's `inferDiscriminator` flattens all leaves through references with `possibleRootTypes`, drops `null`, and accepts a single unambiguous required string-literal property. As a result, an outer union can be discriminated while one of its inner unions contains `null`.

## Schemaprop conversion

| Input | Output |
|---|---|
| `example: x` | `examples: [x]` |
| `minimum: n` + `exclusiveMinimum: true` | `exclusiveMinimum: n`, with no `minimum`. The same rule applies to `maximum` and `exclusiveMaximum`. |
| `exclusiveMinimum: false` / `exclusiveMaximum: false` | dropped |
| `exclusive*: true` with no bound | **Error** naming the type and the property. This is the default; Phase 0 counts real occurrences and may switch it to dropping the flag. |
| everything else (`default`, `deprecated`, `title`, `min*`/`max*`, `pattern`, `multipleOf`, `uniqueItems`, `additionalProperties`) | passed through unchanged |

The unbounded case is real. `lib/src/generators/openapi3/__spec-examples__/contract-with-schemaprops.ts` sets `exclusiveMaximum: true` alongside only a `minimum`.

## Self-check

The generator validates its own output before returning it. Any violation throws `OpenApi31ComplianceError`, which lists every violation it found.

### Structural validation

1. **Vendor the schema.** Add the latest official OAS 3.1 schema (from `https://spec.openapis.org/oas/3.1/schema/`) as a `.ts` module, `oas-3-1-schema.ts`, with its `$id` and source URL in a header comment. It has to be `.ts` rather than `.json`: `tsconfig.json` has no `resolveJsonModule`, and the Dockerfile builds with plain `tsc`.
2. **Rewrite `$dynamicRef` when loading.** ajv 8 supports `$dynamicRef` only in part. In the OAS schema, the `$dynamicAnchor` is reachable only through `$dynamicRef`, so ajv falls back to the root schema. That gives either false failures or no validation at all. Deep-clone the schema and replace each `{"$dynamicRef": "#meta"}` with `{"$ref": "https://json-schema.org/draft/2020-12/schema"}`. ajv bundles that meta-schema. A test asserts the exact number of replacements, so a schema update fails loudly.
3. **Compile the validator.** Use `Ajv2020` from `ajv/dist/2020`. `ajv` is already a runtime dependency. Options: `{strict: false, allErrors: true}`. Add `ajv-formats`, plus a no-op `media-range` format, because ajv throws on unknown formats. Follow the import pattern in `lib/src/validation-server/verifications/contract-mismatcher.ts`. Do not enable ajv's `discriminator` option.
4. **Validate the serialised form.** Run the check on `JSON.parse(JSON.stringify(doc))`, and have `generateOpenAPI31` return that form. The emitters leave keys whose value is `undefined`, and the schema's `unevaluatedProperties: false` would reject them. Serialised output is unaffected, because `generate.ts` already drops `undefined` in both formats.
5. **Cache the compiled validator per process.** Compiling costs roughly 100–200 ms, paid on the first call.

### Semantic checks

The meta-schema cannot express these.

- No `nullable` key appears anywhere.
- Every `$ref` starts with `#/components/schemas/`, and its target exists.
- For each `discriminator`:
  - it sits beside a `oneOf`, and no member of that `oneOf` admits `null`;
  - when there is a `mapping`, every member is a `$ref`, and the mapping values equal the set of `oneOf` refs;
  - every target (following `$ref` chains and merging `allOf`) has `propertyName` as a required property, and that property's `enum` contains the mapping key;
  - its shape is `propertyName` (a string) plus `mapping` (strings), with no other keys.
- No boolean `exclusiveMinimum` or `exclusiveMaximum`, and no schema-level `example`.
- Each server variable's `default` is a member of its `enum`.
- `oneOf` members that overlap and can be detected (for example `Int32 | Float`) produce a **warning**, not a failure. The current generator has the same semantics; see open question 1.

## Phases

### Conventions

- **Titles:** use the repo's `type(COMPASS-18): …` form, for example `fix(COMPASS-17): …` in `git log`.
- **PRs:** atomic, and draft until CI is green.
- **Every PR after PR 1** must show empty output from:

  ```sh
  git diff origin/master -- lib/src/generators/openapi3 lib/src/types.ts lib/src/parsers
  ```

- **Deferred work** gets its own follow-up ticket, never a `TODO(COMPASS-18)`.

### Phase 0 — consumer probe (no SPOT code)

Post the results on COMPASS-18, and add them to this document under a *Phase 0 results* heading.

1. **Probe document.** Hand-write `probe.yaml`, a 3.1 document with:
   - one schema for every row of the emission table;
   - 2-level and 3-level nested discriminated unions;
   - a nullable intersection;
   - `description` beside `$ref`.
2. **Clients.** Use `openapitools/openapi-generator-cli`, latest 7.x at least seven days old, pinned by tag. Run `typescript-fetch` and `typescript-axios`, each with and without `--openapi-normalizer SIMPLIFY_ONEOF_ANYOF=true`.
3. **Compile** every client with `tsc --strict --noEmit` in three configurations:
   - browser: `lib: ["es2020", "dom"]`;
   - Node: no DOM, with `@types/node`;
   - React Native: `types: ["react-native"]`, no DOM.

   Record which runtime globals each client needs: `fetch`, `URLSearchParams`, `FormData`, `Blob`. Record which of them React Native provides without a polyfill.
4. **Real contracts.** Run `spot generate -g raw` on the monorepo contracts under `apis/public-facing/http/api-client-v1` and `apis/public-facing/http/legacy-rails-monolith`. Count each of these shapes:
   - nested discriminated unions;
   - inner unions that contain `null` or an inline member;
   - unbounded `exclusive*` flags;
   - overlapping `oneOf` members;
   - nullable intersections;
   - aliases to unions.

**Decisions to record:**

- `anyOf` or `oneOf` for nullable refs, and for unions without a discriminator;
- whether to emit `description` beside `$ref`;
- `{type: "null"}` for a lone `null`, or an error;
- `3.1.0` or `3.1.1`;
- an error or a drop for unbounded `exclusive*`;
- `typescript-fetch` or `typescript-axios` for React Native, web and Node.

**Exit:** both clients compile under `--strict` for browser and Node, or the blockers are recorded on COMPASS-18 and escalated before PR 2.

### PR 1 — `test(COMPASS-18): freeze legacy openapi3 output`

- Add `lib/src/generators/openapi3/openapi3-freeze.spec.ts`. It generates the current output for every contract in `openapi3/__spec-examples__/` and for `test-fixtures/contract/api.ts`.
- It compares the sha256 of `JSON.stringify(result, null, 2)` against a map of hashes written into the test, which `jest -u` cannot rewrite.
- **Accept when:** it passes on `master`, and changing `"3.0.2"` locally makes it fail.

### PR 2 — `feat(COMPASS-18): scaffold the openapi3.1 generator module`

Add these files under `lib/src/generators/openapi3-1/`:

| File | Contents |
|---|---|
| `index.ts` | exports `generateOpenAPI31` and `* as Specification` |
| `openapi3-1-specification.ts` | Minimal 3.1 types: a single `SchemaObject` with `type?: JsonType \| JsonType[]`, `$ref`, `oneOf` / `anyOf` / `allOf`, `discriminator`, `examples?: unknown[]`, and numeric `exclusive*`. There is no `nullable`, so the shape behind defect 1 cannot be expressed. |
| `openapi3-1.ts` | A copy of `openapi3/openapi3.ts`, with `openapi: "3.1.0"`, descriptions kept beside `$ref`, and output normalised through JSON. |
| `openapi3-1-type-util.ts` | Primitives, literals, objects, arrays and plain refs. Nullable and union shapes throw "not yet supported" until PR 3. |

**Tests:**

- Unit tests ported from the primitive cases in `openapi3-type-util.spec.ts`.
- Snapshot tests over the current `openapi3/__spec-examples__` contracts that contain no `null`. Import those contracts from their current location; do not copy them.

### PR 3 — `feat(COMPASS-18): emit 3.1 nullability, unions and intersections`

**Scope:** the full emission table, except flattening nested unions.

**Add to `openapi3-1/__spec-examples__/`:**

- `contract-with-nullable-types.ts`
- `contract-with-unions.ts`, covering:
  - a union of literals;
  - a mixed union;
  - unions with and without a discriminator;
  - a nullable variant of each.
- `contract-with-nullable-references.ts`, including a target that already admits null.
- `contract-with-nullable-intersections.ts`
- `contract-with-null-type.ts`

**Tests:**

- one unit test per table row;
- snapshots;
- an assertion that no `nullable` key appears anywhere in the output.

### PR 4 — `feat(COMPASS-18): flatten nested discriminated unions to leaf references`

Add `openapi3-1/discriminator.ts`, exporting `discriminatedLeafReferences(member, typeTable): { leaves: ReferenceType[]; nullable: boolean }`. The shared `types.ts` is not edited. It is used read-only: `possibleRootTypes` and `dereferenceType`.

**Behaviour:**

- **Inline members** at the top level of the outer union keep a discriminator with no mapping. This matches the current generator and is spec-legal.
- **Reference members:**
  - Follow aliases to the first target that is not a reference.
  - If that target is a union, record any `null` member (it is lifted to the outer level), then recurse into each other member. Every other member must be a reference. If one is inline, throw an error that names the union and the member.
  - Otherwise, the leaf is the member's own reference, keeping the name the author wrote.
- **Deduplication:** remove repeated leaves by name, keeping the first one seen; this handles diamonds. Detect cycles with a visited set.
- **Mapping:** for each leaf, take `possibleRootTypes(leaf)[0]` (which merges intersections). Dereference the discriminator property, require a string literal, and set `mapping[value]` to the leaf ref. If one value maps to two different leaves, throw.
- **Wrapper components** such as `AdsSlider` are still emitted as their own components, each with its own `oneOf` and discriminator.
- **Scope:** flatten only unions that have a discriminator. A plain `oneOf` that references wrapper schemas is already valid.

**Tests:**

- Port the nested-union cases from `openapi3-type-util.spec.ts` with the new expectation that leaf refs appear in both `oneOf` and `mapping`.
- Add cases for:
  - depth 3;
  - an alias to a union;
  - a diamond;
  - an inline inner member (throws);
  - an inner nullable union (null lifted to an outer `anyOf`);
  - an intersection leaf;
  - a duplicate discriminator value (throws).
- Add `__spec-examples__/contract-with-nested-discriminated-unions.ts`.

### PR 5 — `feat(COMPASS-18): convert schemaprops to JSON Schema 2020-12`

- Implement the conversions in *Schemaprop conversion*.
- **Tests:**
  - a new spec-example of 3.1 schemaprops;
  - the current `contract-with-schemaprops.ts` produces the unbounded-`exclusive*` error, or the drop if Phase 0 chose that.

### PR 6 — `feat(COMPASS-18): self-check openapi3.1 output against the OAS 3.1 schema`

- Add `openapi3-1/oas-3-1-schema.ts` and `openapi3-1/validate.ts`, exporting `validateOpenAPI31(doc): Violation[]`. `generateOpenAPI31` throws if the result is not empty.
- **Tests:**
  - the number of `$dynamicRef` replacements;
  - a failing document for each defect class, each with a precise message:
    - findings 1, 2, 3 and 5;
    - a boolean `exclusiveMinimum`;
    - an unresolved `$ref`;
    - `null` inside a discriminated `oneOf`;
    - an invalid `type`;
  - every spec-example passes;
  - an un-normalised document containing `undefined` keys would fail.
- Confirm the `$dynamicRef` behaviour against the locked `ajv` 8.18.0, not only a newer version.

### PR 7 — `feat(COMPASS-18): add openapi3.1 to spot generate and the public API`

| File | Change |
|---|---|
| `cli/src/commands/generate.ts` | Add `"openapi3.1": { transformer: generateOpenAPI31, formats: { json: jsonFormat, yaml: yamlFormat } }`, with the key quoted. |
| `scripts/check-image-parity` | Add `openapi3.1:json` and `openapi3.1:yaml` to `CASES`. The script fails if a registered generator has no case, and its key pattern accepts `.`. |
| `lib/src/core.ts` | `import * as OpenApi31 from "./generators/openapi3-1"`, and export it next to `OpenApi3`. |
| `README.md` | Add a usage line for `-g openapi3.1` and an example of `Spot.OpenApi31.generateOpenAPI31`. Note that both OpenAPI generators write `<contract>.yml` / `.json`, so each needs its own `--out` directory. |
| `AGENTS.md` (`CLAUDE.md` is a symlink to it) | Add the new generator to the *Generators* list and to *CLI Usage*. |

The Dockerfile and `.dockerignore` need no change: they copy `lib/` and `cli/` whole, and `ajv` is already a production dependency.

**Accept when:**

- CI is green, including `docker-parity` with 9 cases;
- this command succeeds:

  ```sh
  node ./bin/run generate -c test-fixtures/contract/api.ts -g openapi3.1 -l yaml -o out
  ```

### PR 8 — `chore(release): v2.2.0`

- **Bump the version to v2.2.0.** This is a minor bump because the change adds a generator. Bump `package.json` and run `prepack` to refresh the oclif section of the README.
- **Release gate:** before cutting the GitHub Release, re-run the Phase 0 client generation and compile checks against the real `api-client-v1` contract, using the built generator. The Release publishes both the npm package and the Docker image.

### Follow-up tickets

Create these; don't leave TODOs.

- **Monorepo:** generate the openapi-generator TypeScript client for the React Native marketplace app. This needs a generate script, a client package, and an image pin in `scripts/openapi/images.env`.
- **`openapi-generators`** (only if mobile Kotlin or Swift is to move too): read 3.1 input, for example by converting it down to 3.0 when loading.
- **JSON Schema test suite:** `lib/src/generators/json-schema/json-schema.spec.ts` registers a Spectral format but loads no ruleset, so its "no Spectral findings" assertions always pass.

## Risks

| Risk | Mitigation |
|---|---|
| openapi-generator's 3.1 support is incomplete: `type` arrays, `anyOf` containing `null`, `$ref` with siblings | Phase 0 gates PR 2 and later. Every encoding choice can fall back. |
| React Native's `URLSearchParams`, `Blob` and `FormData` are incomplete without polyfills, which affects `typescript-fetch`. axios works everywhere but adds a dependency. | Phase 0 compiles for React Native and records which globals are needed. |
| ajv's partial `$dynamicRef` support | The rewrite at load time, with the replacement count pinned by a test. |
| New hard errors reject real contracts: unbounded `exclusive*`, an inline inner-union member, a duplicate discriminator value | Phase 0 counts them. The release gate in PR 8 generates the real contract before publishing. |
| `oneOf` members that overlap, carried over from the current generator | A self-check warning, and open question 1. |
| The copied `openapi3.ts` logic drifts from the current generator | Accepted, given the six-month lifespan. |
| The current output changes by accident | The PR 1 hash test, plus the empty-diff rule on every later PR. |

## Open questions

Phase 0 settles each of these unless noted otherwise.

1. For a union without a discriminator, keep `oneOf` or switch to `anyOf`?
2. Emit `{type: "null"}` for a lone `null`, or throw as the current generator does?
3. Does a nullable intersection stay nullable through `anyOf`, or is that rejected?
4. `3.1.0` or `3.1.1`?
5. Should there be a `--no-verify` escape hatch for the self-check? Recommended: no. A mode called "strict" that can be switched off guarantees nothing.

## Verification

1. **Tests.** `pnpm build && pnpm test`. The PR 1 hash test passes unchanged, and `git diff origin/master` over the frozen paths is empty.
2. **Generation.** Generate both formats with `-g openapi3.1` for `test-fixtures/contract/api.ts` and for the monorepo `api-client-v1` contract. Success shows that the self-check passed.
3. **Finding counts.** Run these counts on the 3.1 JSON:

   ```sh
   jq '[..|objects|select(has("$ref") and has("nullable"))]|length' out/api.json   # finding 1 → 0
   jq '[..|objects|select(has("nullable"))]|length' out/api.json                   # findings 2, 5 → 0
   ```

   For finding 3, every mapping value must appear in its `oneOf`, and every mapping target must list `propertyName` as required. The semantic checks in `validate.ts` enforce both. Finding 4 is reported only.
4. **Linting.** `redocly lint` with a pinned version reports no errors on the 3.1 output, and `oasdiff` loads it.
5. **Clients.** Generate the `typescript-fetch` and `typescript-axios` clients, then compile each with `tsc --strict --noEmit` for browser, Node and React Native.
6. **Current output.** `-g openapi3` output is byte-identical to a build of `master`, and the bff contract still shows 397 / 4 / 4.
7. **Image parity.** `scripts/check-image-parity <image>` passes with 9 cases.

## Files

- **New:** `lib/src/generators/openapi3-1/*`
- **Edited:**
  - `cli/src/commands/generate.ts`
  - `scripts/check-image-parity`
  - `lib/src/core.ts`
  - `README.md`
  - `AGENTS.md`
  - `package.json` (release only)
- **Read only, never modified:**
  - `lib/src/generators/openapi3/openapi3.ts` (the basis for the copy)
  - `lib/src/generators/openapi3/openapi3-type-util.ts`
  - `lib/src/types.ts` (`possibleRootTypes`, `dereferenceType`, `inferDiscriminator`)
  - `lib/src/parsers/schemaprop-parser.ts`

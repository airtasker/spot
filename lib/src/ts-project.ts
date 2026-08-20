import * as path from "path";
import { CompilerOptions, Project, ts } from "ts-morph";

/**
 * The type root `@types/node` resolves from.
 *
 * Derived from where the package actually resolved rather than from a fixed
 * number of `..` steps, so it survives both the compiled layout and pnpm's
 * symlinked store.
 *
 * A root for `@types/node` and nothing else, under pnpm: `require.resolve`
 * realpaths into the store, and that directory holds the one package. npm and
 * yarn hoist, so the same expression there returns a directory holding every
 * `@types` package installed. A second entry in `types` would resolve under
 * those and fail under pnpm.
 */
function nodeTypesRoot(): string {
  return path.dirname(
    path.dirname(require.resolve("@types/node/package.json"))
  );
}

/**
 * The compiler options every Spot contract is parsed and type-checked under.
 *
 * The `@airtasker/spot` mapping resolves a contract's own import of the package
 * to Spot's copy of the syntax declarations — `lib.ts` from source, `lib.d.ts`
 * once compiled, both siblings of this file — so a contract type-checks with no
 * installed `node_modules/@airtasker/spot` beside it. TypeScript consults
 * `paths` before `node_modules`, so an installed copy does not take precedence
 * over the running Spot's declarations for this specifier.
 *
 * `skipLibCheck` because a declaration file's own errors are not the contract
 * author's to fix and no `--fix` can reach them.
 */
export const contractCompilerOptions: CompilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.CommonJS,
  strict: true,
  noImplicitAny: true,
  strictNullChecks: true,
  strictFunctionTypes: true,
  strictPropertyInitialization: true,
  noImplicitThis: true,
  resolveJsonModule: true,
  alwaysStrict: true,
  noImplicitReturns: true,
  noFallthroughCasesInSwitch: true,
  skipLibCheck: true,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  experimentalDecorators: true,
  // TypeScript 6 reports `moduleResolution: node10` as deprecated and refuses
  // to run without this. Keeping node10 keeps contract resolution exactly as it
  // is; moving off it changes how a contract's own imports resolve, which is a
  // decision about published behaviour rather than part of a dependency bump.
  // It stops working altogether in TypeScript 7, which is
  // https://airtasker.atlassian.net/browse/COMPASS-31
  ignoreDeprecations: "6.0",
  // TypeScript 6 no longer picks up `node_modules/@types` on its own, so a
  // contract that imports a node builtin stops type-checking unless the types
  // are named. `typeRoots` points at Spot's own copy for the same reason
  // `paths` does below: the default walks up from the working directory, which
  // for the image is a mounted workspace that has no `node_modules` at all.
  // `@types/node` is a runtime dependency because of this — it has to reach the
  // image, which installs production dependencies only.
  //
  // These two are the whole of what a contract can rely on ambiently. Under
  // TypeScript 5 it reached every `@types` package resolvable from where it
  // sat, and there is no option that restores that. Whether to give the reach
  // back is https://airtasker.atlassian.net/browse/COMPASS-32
  types: ["node"],
  typeRoots: [nodeTypesRoot()],
  paths: {
    "@airtasker/spot": [path.join(__dirname, "lib")]
  }
};

/**
 * Create an in-memory TypeScript project configured for Spot contracts.
 */
export function createContractProject(): Project {
  return new Project({ compilerOptions: contractCompilerOptions });
}

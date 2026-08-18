import * as fs from "fs";
import * as path from "path";
import { CompilerOptions, Project, ts } from "ts-morph";

/**
 * The declarations the `@airtasker/spot` path mapping resolves to: `lib.ts`
 * when running from source (ts-jest, ts-node), `lib.d.ts` once compiled. Both
 * are siblings of this file, so the mapping is relative to this module's
 * directory and must stay so.
 */
const SPOT_DECLARATIONS = path.join(__dirname, "lib");

/**
 * The compiler options every Spot contract is parsed and type-checked under.
 *
 * The `@airtasker/spot` path mapping resolves a contract's own import of the
 * package to Spot's copy of the syntax declarations, so a contract type-checks
 * with no installed `node_modules/@airtasker/spot` beside it.
 *
 * TypeScript consults `paths` before `node_modules`, so this mapping also takes
 * precedence over an installed copy when there is one: a contract is always
 * type-checked against the declarations of the Spot that is running, never
 * against a different version installed next to it. That is the intended rule —
 * the parser and the declarations it checks against are one version — and it
 * means an older pinned `@airtasker/spot` beside a contract no longer changes
 * how that contract parses.
 *
 * Frozen because `ts-lint` shares this object: a mutation anywhere would change
 * every subsequent `parse()` in the process.
 */
export const contractCompilerOptions: CompilerOptions = Object.freeze({
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
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  experimentalDecorators: true,
  baseUrl: "./",
  paths: {
    "@airtasker/spot": [SPOT_DECLARATIONS]
  }
});

/**
 * Fail if the mapping target does not exist.
 *
 * TypeScript treats `paths` as a hint: an entry naming a file that is not there
 * falls back to node resolution with no diagnostic. So a mapping broken by a
 * change to the emitted layout would not report as a broken mapping — a
 * contract would resolve against an installed copy, or fail with a bare
 * "Cannot find module", depending on what happens to sit beside it. Checking
 * the target directly is what turns that into an error naming the real cause.
 */
function assertSpotDeclarationsResolve(): void {
  const candidates = [".ts", ".d.ts"].map(ext => `${SPOT_DECLARATIONS}${ext}`);
  if (candidates.some(candidate => fs.existsSync(candidate))) {
    return;
  }
  throw new Error(
    `Spot's own @airtasker/spot declarations are missing: expected ` +
      `${candidates.join(" or ")}. Contracts cannot be type-checked against ` +
      `the running Spot without them. This usually means the emitted layout ` +
      `moved — check outDir and rootDir in tsconfig.json.`
  );
}

/**
 * Create an in-memory TypeScript project configured for Spot contracts.
 */
export function createContractProject(): Project {
  assertSpotDeclarationsResolve();
  return new Project({ compilerOptions: contractCompilerOptions });
}

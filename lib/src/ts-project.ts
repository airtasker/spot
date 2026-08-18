import * as path from "path";
import { CompilerOptions, Project, ts } from "ts-morph";

/**
 * The compiler options every Spot contract is parsed and type-checked under.
 *
 * The `@airtasker/spot` path mapping resolves the contract's own import of the
 * package to Spot's copy of the syntax declarations, so a contract type-checks
 * without an installed `node_modules/@airtasker/spot` next to it. It is
 * relative to this module's directory and must stay so: `lib/src/lib.ts` when
 * running from source (ts-jest, ts-node), `build/lib/src/lib.d.ts` once
 * compiled — both siblings of this file.
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
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  experimentalDecorators: true,
  baseUrl: "./",
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

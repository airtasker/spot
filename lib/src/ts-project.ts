import * as path from "path";
import { CompilerOptions, Project, ts } from "ts-morph";

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

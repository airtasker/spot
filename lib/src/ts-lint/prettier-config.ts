import { Options } from "prettier";
import * as estreePlugin from "prettier/plugins/estree";
import * as typescriptPlugin from "prettier/plugins/typescript";

/**
 * The formatting Spot contracts are held to.
 *
 * Passed to Prettier explicitly on every call, alongside `prettier/standalone`
 * rather than the default entry point. Neither Prettier's config discovery nor
 * its plugin resolution is used, so a `.prettierrc` left behind next to a
 * contract cannot change how that contract is formatted, and the TypeScript
 * parser is the one this package installed.
 */
export const prettierConfig: Options = {
  parser: "typescript",
  plugins: [estreePlugin, typescriptPlugin],
  trailingComma: "none",
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  printWidth: 80
};

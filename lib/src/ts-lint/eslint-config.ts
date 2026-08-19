import js from "@eslint/js";
import { Linter } from "eslint";
import prettierConfig from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

/**
 * The lint rules Spot contracts are held to.
 *
 * This is a value, not a config file path. `ts-lint` hands it to ESLint with
 * `overrideConfigFile: true`, so the plugins are the ones this module
 * imported — resolved from Spot's own `node_modules` — and an
 * `eslint.config.*` sitting next to a contract is neither read nor needed.
 *
 * Contract syntax is why most of the rules below are off: an endpoint is a
 * class nobody references, holding decorated methods with empty bodies, whose
 * parameters exist to be read by the parser rather than by the code.
 */
export const eslintConfig: Linter.Config[] = tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  // Formatting is the Prettier step's job. Without this, a rule that also has
  // an opinion about layout reports a second, differently-worded complaint
  // about a line Prettier has already flagged.
  prettierConfig,
  {
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase", "PascalCase"] },
        // Header and query-parameter names are wire names — `x-auth-token`,
        // `sample-query` — and are not the contract author's to choose.
        { selector: "property", format: null }
      ],
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      // A contract imports `String`, `Number` and `Boolean` from
      // `@airtasker/spot`, and that import shadows the global — so on a
      // well-formed contract this rule has nothing to say either way. What
      // turning it off suppresses is the opposite case: a file that names the
      // global because the import is missing. That is a real mistake, and it is
      // caught where it has consequences, by the parser rejecting the type,
      // rather than as a wrapper-object complaint here.
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/no-unsafe-function-type": "off"
    }
  }
) as Linter.Config[];

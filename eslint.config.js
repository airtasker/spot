const js = require("@eslint/js");
const jest = require("eslint-plugin-jest");
const globals = require("globals");
const tseslint = require("typescript-eslint");

// Empty-bodied decorated methods and unused decorator imports are how a Spot
// contract is written, so the rules that object to them are off wherever
// contract syntax lives rather than repo-wide.
const CONTRACT_SYNTAX_FILES = [
  "**/__spec-examples__/**/*.ts",
  "lib/src/validation-server/spots/**/*.ts",
  "test-fixtures/**/*.ts"
];

module.exports = tseslint.config(
  {
    ignores: [
      // `**/` so a nested build directory is ignored too, not only the root one.
      "**/build/",
      "docs/webpack.config.js",
      "jest.config.js",
      "jest.ci.config.js"
    ]
  },
  {
    // Core rules only. typescript-eslint's recommended set switches off the
    // core checks the compiler already performs, and `tseslint.config()` applies
    // an extended config to the parent's `files` — so extending it here would
    // drop those checks from files nothing compiles.
    files: ["**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs"
    }
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node
    },
    rules: {
      // Spot's contract vocabulary reuses `String`, `Number` and `Boolean` as
      // types, and `{}` appears as a contract type. Empty interfaces stay
      // reported, which is what `allowObjectTypes` leaves on.
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowObjectTypes: "always" }
      ],
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-use-before-define": "off",
      // Warn: the remaining sites are deliberate.
      "@typescript-eslint/no-explicit-any": "warn",
      // Named explicitly: this rule is in `strict`, not `recommended`.
      "@typescript-eslint/no-non-null-assertion": "warn"
    }
  },
  {
    files: ["**/*.spec.ts"],
    extends: [jest.configs["flat/recommended"]]
  },
  {
    files: CONTRACT_SYNTAX_FILES,
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["lib/src/syntax/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
);

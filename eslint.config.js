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
      "build/",
      "docs/webpack.config.js",
      "jest.config.js",
      "jest.ci.config.js"
    ]
  },
  {
    files: ["**/*.js", "**/*.ts", "**/*.tsx"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node
    },
    rules: {
      // The three rules typescript-eslint 8 split `ban-types` into; the old
      // config turned that rule off, and `String` et al are Spot's own
      // contract vocabulary.
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-use-before-define": "off",
      // Warn, the severity it carried before the upgrade. Tightening it to an
      // error is a separate piece of work from this migration.
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs"
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    files: ["**/*.spec.ts"],
    extends: [jest.configs["flat/recommended"]],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off"
    }
  },
  {
    files: CONTRACT_SYNTAX_FILES,
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["lib/src/syntax/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-empty-function": "off"
    }
  },
  {
    files: ["**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
);

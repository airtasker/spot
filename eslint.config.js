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
      // Anchored to the config's own directory, so a bare `build/` would match
      // only the one at the root. `.eslintignore` matched at any depth.
      "**/build/",
      "docs/webpack.config.js",
      "jest.config.js",
      "jest.ci.config.js"
    ]
  },
  {
    // Core rules only. typescript-eslint's recommended set bundles its
    // `eslint-recommended` block, which switches off the core checks the
    // compiler already performs — `no-undef`, `no-redeclare`, `no-unreachable`
    // and a dozen more. Those files are never compiled, so nothing else is
    // checking them: extending the TypeScript preset here would drop the
    // checks rather than defer them.
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
      // `String`, `Boolean` and `Date` are Spot's own contract vocabulary, not
      // the JavaScript wrapper objects these rules exist to catch, and `{}`
      // appears as a contract type. Empty *interfaces* stay checked: that is
      // `no-empty-interface`, which v8 folded into `no-empty-object-type`, and
      // it was never part of the allowance.
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowObjectTypes: "always" }
      ],
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-use-before-define": "off",
      // The two sites are deliberate: `Example.value` carries an untyped JSON
      // literal, and `typeOf()` takes anything. Warn rather than error so they
      // report without needing individual suppressions.
      "@typescript-eslint/no-explicit-any": "warn",
      // v8 moved this out of `recommended` into `strict`. Named explicitly so
      // the upgrade does not silently stop reporting the sites it covers.
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

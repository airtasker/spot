module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "jest"
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended"
  ],
  rules: {
    // "@typescript-eslint/camelcase": ["error", { properties: "never" }],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-use-before-define": "off"
  },
  overrides: [
    {
      files: [
        "**/__spec-examples__/**/*.ts",
        "lib/src/validation-server/spots/**/*.ts"
      ],
      rules: {
        "@typescript-eslint/ban-types": "off",
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
      files: ["*.tsx"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off"
      }
    },
    {
      files: ["*.spec.ts"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off"
      }
    }
  ]
};

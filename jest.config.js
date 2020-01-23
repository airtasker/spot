module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/?(*.)+(spec).ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"]
};

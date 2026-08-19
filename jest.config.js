module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/?(*.)+(spec).ts"],
  // .claude/worktrees holds full checkouts whose spec files testMatch would
  // otherwise collect, running the suite again over another branch's code.
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.claude/"]
};

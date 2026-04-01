import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^server-only$": "<rootDir>/tests/synthetic/__mocks__/server-only.ts",
  },
  testMatch: ["<rootDir>/tests/synthetic/runner.test.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs" } }],
  },
  // Each test calls real Claude API — allow 120s per test
  testTimeout: 120000,
};

export default config;

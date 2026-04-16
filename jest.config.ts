import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/.claude/", "/tests/synthetic/"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs" } }],
  },
  // Coverage configuration — enforces 70% threshold across all metrics
  collectCoverage: false, // off by default; use `npm run test:coverage` to enable
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "!src/lib/**/*.test.ts",
    "!src/lib/**/*.d.ts",
    "!src/lib/**/CLAUDE.md",
  ],
  coverageProvider: "v8",
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
};

export default config;

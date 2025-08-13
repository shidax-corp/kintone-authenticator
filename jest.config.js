import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

export default {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  projects: [
    {
      displayName: "node",
      testEnvironment: "node",
      testMatch: [
        "<rootDir>/src/lib/**/*.test.ts",
        "<rootDir>/src/chrome/lib/storage.test.ts",
        "<rootDir>/src/chrome/lib/kintone-client.test.ts"
      ],
      transform: {
        ...tsJestTransformCfg,
      },
    },
    {
      displayName: "jsdom",
      testEnvironment: "jsdom",
      testMatch: [
        "<rootDir>/src/chrome/lib/url-matcher.test.ts"
      ],
      transform: {
        ...tsJestTransformCfg,
      },
    }
  ]
};

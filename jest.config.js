import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

export default {
  testEnvironment: 'node',
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.js'],
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/lib/**/*.test.ts',
        '<rootDir>/src/chrome/lib/storage.test.ts',
        '<rootDir>/src/chrome/lib/kintone-client.test.ts',
      ],
      transform: {
        ...tsJestTransformCfg,
      },
      moduleNameMapper: {
        '^@lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
      },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/chrome/lib/url-matcher.test.ts',
        '<rootDir>/src/chrome/lib/content-react-helper.test.ts',
        '<rootDir>/src/**/*.test.tsx',
      ],
      transform: {
        ...tsJestTransformCfg,
      },
      moduleNameMapper: {
        '^@lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/test-setup.js'],
    },
  ],
};

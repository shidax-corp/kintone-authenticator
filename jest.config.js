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
        '<rootDir>/src/chrome/lib/types.test.ts',
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
        '<rootDir>/src/chrome/contents/page-info.test.ts',
        '<rootDir>/src/chrome/contents/notification.test.ts',
        '<rootDir>/src/chrome/popup/tab-utils.test.ts',
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

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Base configuration for all files
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        Image: 'readonly',
        crypto: 'readonly',
        navigator: 'readonly',
        
        // Node.js globals  
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        require: 'readonly',
        NodeJS: 'readonly',
        
        // Chrome extension globals
        chrome: 'readonly',
        
        // Kintone globals
        kintone: 'readonly',
        
        // React/styled-jsx
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: react,
      'react-hooks': reactHooks,
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // TypeScript ESLint recommended rules
      ...tseslint.configs.recommended.rules,

      // React recommended rules
      ...react.configs.recommended.rules,

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // React settings
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/no-unknown-property': ['error', { ignore: ['jsx'] }], // Allow styled-jsx

      // Disable rules that conflict with Prettier
      'no-trailing-spaces': 'off',
      'comma-dangle': 'off',
      'semi': 'off',
      'quotes': 'off',
      'indent': 'off',
      '@typescript-eslint/indent': 'off',

      // TypeScript specific adjustments for the existing codebase
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn', // Warning instead of error for gradual migration
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off', 
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-require-imports': 'off', // Allow require in setup files

      // Allow console.log for development
      'no-console': 'warn',
      'react/jsx-no-target-blank': 'warn', // Warning instead of error
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Test files configuration
  {
    files: ['src/**/*.test.{js,jsx,ts,tsx}', 'src/test-setup.js'],
    languageOptions: {
      globals: {
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      // Allow console in test files
      'no-console': 'off',
      // Allow any in test files for mock data
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Type definition files
  {
    files: ['src/**/*.d.ts'],
    rules: {
      // Allow any in type definitions
      '@typescript-eslint/no-explicit-any': 'off',
      'no-var': 'off',
    },
  },

  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      '*.config.js',
      '*.config.mjs',
      'jest.config.js',
    ],
  },
];
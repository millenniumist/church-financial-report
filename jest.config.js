process.env.NEXT_SKIP_WORKSPACE_ROOT_PROMPT = '1';

const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/playwright-report/'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/out/',
    '<rootDir>/playwright-report/',
    '<rootDir>/e2e/',
  ],

  // Comprehensive coverage collection
  collectCoverageFrom: [
    // Application code
    '<rootDir>/app/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/components/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/lib/**/*.{js,jsx,ts,tsx}',

    // Exclude patterns
    '!<rootDir>/app/**/layout.{js,jsx,ts,tsx}',
    '!<rootDir>/app/**/loading.{js,jsx,ts,tsx}',
    '!<rootDir>/app/**/error.{js,jsx,ts,tsx}',
    '!<rootDir>/app/**/not-found.{js,jsx,ts,tsx}',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/**/index.{js,jsx,ts,tsx}',
    '!<rootDir>/**/generated/**',
    '!<rootDir>/**/*.config.{js,ts}',
    '!<rootDir>/**/*.stories.{js,jsx,ts,tsx}',
  ],

  coverageDirectory: '<rootDir>/coverage',

  // Strict coverage thresholds for TDD
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Stricter for lib (business logic)
    './lib/**/*.{js,jsx,ts,tsx}': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Better test output
  verbose: true,
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/?(*.)+(spec|test).(js|jsx|ts|tsx)',
  ],

  // Watch mode settings
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Performance
  maxWorkers: '50%',

  // Clear mocks automatically
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

module.exports = createJestConfig(customJestConfig);

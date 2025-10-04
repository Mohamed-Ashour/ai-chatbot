const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],
  testEnvironment: '<rootDir>/jest-environment.js',
  
  // Enable ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Configure module handling
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock ESM modules that cause issues
    '^remark-gfm$': '<rootDir>/src/__tests__/mocks/remark-gfm.js',
    '^rehype-highlight$': '<rootDir>/src/__tests__/mocks/rehype-highlight.js',
    '^rehype-raw$': '<rootDir>/src/__tests__/mocks/rehype-raw.js',
  },
  
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/*.tsx',
  ],
  
  // Transform ESM modules in node_modules - expanded patterns to handle all markdown/syntax highlighting ESM packages
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      // Remark ecosystem
      'remark-.*|' +
      'rehype-.*|' +
      'micromark.*|' +
      'mdast-util.*|' +
      'hast-util.*|' +
      'unist-util.*|' +
      'vfile.*|' +
      // Character encoding and utilities
      'decode-named-character-reference|' +
      'character-entities.*|' +
      'space-separated-tokens|' +
      'comma-separated-tokens|' +
      'property-information|' +
      'web-namespaces|' +
      // Core utilities
      'unified|' +
      'bail|' +
      'is-plain-obj|' +
      'trough|' +
      'zwitch|' +
      'devlop|' +
      'fault|' +
      // Syntax highlighting
      'lowlight|' +
      'highlight.js|' +
      'hastscript|' +
      // String utilities
      'longest-streak|' +
      'ccount|' +
      'escape-string-regexp|' +
      'trim-lines' +
    ')/)'
  ],
  
  // Configure test environment options for React 18+ concurrent features
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
}

module.exports = createJestConfig(customJestConfig)

export default {
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/thirdparty/',
    '/src/pairtest/lib',
  ],
  collectCoverage: true,
  collectCoverageFrom: ['./src/**'],
  coverageThreshold: {
    global: {
      lines: 100,
    },
  },
  verbose: true,
  clearMocks: true,
  coverageDirectory: '.coverage',
  setupFiles: ['./test/setup.js'],
};

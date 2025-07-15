export default {
  mutate: ['./src/**', '!./src/pairtest/lib/**', '!./src/thirdparty/**'],
  ignorePatterns: ['.coverage'],
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'off',
  timeoutMS: 20000,
};

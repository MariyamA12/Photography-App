module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  // replace dotenv/config with our quiet loader
  setupFiles: ['<rootDir>/tests/setup/loadEnv.js'],
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/perTestReset.js'],
  moduleNameMapper: { '^src/(.*)$': '<rootDir>/src/$1' },
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/db.js',       // skip env/connection wrappers
    '!src/**/swagger*.js',     // skip generated/config docs
  ],
};

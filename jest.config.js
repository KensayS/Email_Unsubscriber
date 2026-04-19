/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })

module.exports = createJestConfig({
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
})

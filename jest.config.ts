/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
import { Config } from 'jest'

const config: Config = {
  maxWorkers: '50%',
  globals: {
    'ts-jest': {
      isolatedModules: false
    }
  },
  cache: true,
  cacheDirectory: '/tmp/jest_cache',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: [
    'text',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      functions: 60
    }
  },
  setupFiles: [
    '<rootDir>/jest.env.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '.build',
    '/clients/mobile/node_modules/'
  ],
  projects: ['<rootDir>/core/application', '<rootDir>/core/services/aws', '<rootDir>/clients/mobile']
}

export default config

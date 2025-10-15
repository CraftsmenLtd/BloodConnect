/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
import type { Config } from 'jest'

const config: Config = {
  testPathIgnorePatterns: [
    '/node_modules/',
    '.build'
  ],
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  moduleNameMapper: {
    '^commons/(.*)$': '<rootDir>/../../../commons/$1',
    '^core/(.*)$': '<rootDir>/../../../core/$1'
  }
}

export default config

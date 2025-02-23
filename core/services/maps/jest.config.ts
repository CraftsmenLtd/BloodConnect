/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
import { Config } from 'jest'

const config: Config = {
  testPathIgnorePatterns: [
    '/node_modules/',
    '.build'
  ],
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  }
}

export default config

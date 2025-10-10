import rootConfig from '../../../eslint.config.js'

export default [
  ...rootConfig,
  {
    ignores: [
      'tests' // FIXME: this should not be ignored
    ]
  }
]

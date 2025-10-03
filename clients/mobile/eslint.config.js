import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  {
    ignores: [
      'babel.config.js',
      'metro.config.js'
    ]
  }
]

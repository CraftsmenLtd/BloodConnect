import { ConfigAPI } from '@babel/core'

module.exports = function(api: ConfigAPI) {
  (api.cache as unknown as (enabled: boolean) => boolean)(true)
  return {
    presets: ['babel-preset-expo']
  }
}

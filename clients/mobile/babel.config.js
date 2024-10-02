/* eslint-disable import/no-commonjs, no-undef */
module.exports = function(api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo']
  }
}

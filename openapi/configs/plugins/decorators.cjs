const InjectVtlContent = require('./decorators/Inject-vtl-content.cjs')

module.exports = function decoratorsPlugins() {
  return {
    id: 'decorators',
    decorators: {
      oas3: {
        'Inject-vtl-content': InjectVtlContent
      }
    }
  }
}

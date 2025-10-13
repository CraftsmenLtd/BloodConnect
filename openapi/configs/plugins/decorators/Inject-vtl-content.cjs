/* eslint-disable no-undef */
const fs = require('fs')
const path = require('path')

const INTEGRATION_PATH = '../../../../openapi/integration/aws/'
const VTL_IMPORT_PREFIX = '#importVtl '
const CONTENT_TYPE_JSON = 'application/json'

function InjectVtlContent() {

  console.log('Injecting VTL content...')

  return {
    Operation: {
      leave(target) {
        // Process response templates
        processTemplates(
          target?.['x-amazon-apigateway-integration']?.['responses']?.['default']?.[
            'responseTemplates'
          ],
          'response'
        )

        // Process request templates
        processTemplates(
          target?.['x-amazon-apigateway-integration']?.['requestTemplates'],
          'request'
        )
      }
    }
  }
}

/**
 * Processes VTL templates by injecting file content.
 * @param {object} templates - Templates object to process.
 */
function processTemplates(templates) {
  if (
    !templates
    || !templates[CONTENT_TYPE_JSON]
    || !templates[CONTENT_TYPE_JSON].startsWith(VTL_IMPORT_PREFIX)
  ) {
    return
  }

  injectVtlContent(templates[CONTENT_TYPE_JSON], templates)
}

/**
 * Replaces the VTL import path with the actual file content.
 * @param {string} vtlPath - The VTL path to resolve and read.
 * @param {object} templates - Templates object to update.
 */
function injectVtlContent(vtlPath, templates) {
  const resolvedPath = vtlPath.replace(VTL_IMPORT_PREFIX, INTEGRATION_PATH)
  const fullPath = path.resolve(__dirname, resolvedPath)
  try {
    const vtlContent = fs.readFileSync(fullPath, 'utf8')
    templates[CONTENT_TYPE_JSON] = vtlContent
  } catch (error) {
    console.error(`Failed to read VTL file at ${fullPath}:`, error.message)
  }
}

module.exports = InjectVtlContent

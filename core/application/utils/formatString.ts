export const replaceTemplatePlaceholders = (template: string, ...values: string[]): string => {
  return template.replace(/{(\d+)}/g, (_match, index) => {
    return typeof values[index] !== 'undefined' ? values[index] : ''
  })
}

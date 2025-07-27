export const replaceTemplatePlaceholders = (template: string, ...values: string[]): string =>
  template.replace(/{(\d+)}/g, (_match, index) =>
    typeof values[index] !== 'undefined' ? values[index] : ''
  )

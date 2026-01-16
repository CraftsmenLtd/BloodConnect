import { replaceTemplatePlaceholders } from '../../utils/formatString'

describe('replaceTemplatePlaceholders', () => {
  test('should replace placeholders with the corresponding values', () => {
    const template = 'Hello {0}, your code is {1}!'
    const result = replaceTemplatePlaceholders(template, 'John', '12345')
    expect(result).toBe('Hello John, your code is 12345!')
  })

  test('should replace multiple occurrences of the same placeholder correctly', () => {
    const template = '{0} {0} {1}'
    const result = replaceTemplatePlaceholders(template, 'A', 'B')
    expect(result).toBe('A A B')
  })

  test('should replace placeholders even if they are not in order', () => {
    const template = '{2} {1} {0}'
    const result = replaceTemplatePlaceholders(template, 'C', 'B', 'A')
    expect(result).toBe('A B C')
  })

  test('should leave placeholders intact if no corresponding value is provided', () => {
    const template = 'Hello {0}, your code is {1}, verify {2}'
    const result = replaceTemplatePlaceholders(template, 'John', '12345')
    expect(result).toBe('Hello John, your code is 12345, verify ')
  })

  test('should handle template with no placeholders correctly', () => {
    const template = 'Hello World!'
    const result = replaceTemplatePlaceholders(template)
    expect(result).toBe('Hello World!')
  })

  test('should return an empty string if template is empty', () => {
    const template = ''
    const result = replaceTemplatePlaceholders(template, 'Value1', 'Value2')
    expect(result).toBe('')
  })

  test('should handle placeholders with no values correctly', () => {
    const template = '{0} {1} {2}'
    const result = replaceTemplatePlaceholders(template)
    expect(result).toBe('  ')
  })

  test('should handle numeric and boolean values correctly', () => {
    const template = '{0} is {1}'
    const result = replaceTemplatePlaceholders(template, 'Value', String(true))
    expect(result).toBe('Value is true')
  })
})

/**
 * A simple function that checks and converts data to json
 *
 * @returns The a json type data.
 */
export const parseJsonData = <T>(data: any): T | null => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (error) {
    console.error('Failed to parse JSON data:', error)
    return null
  }
}

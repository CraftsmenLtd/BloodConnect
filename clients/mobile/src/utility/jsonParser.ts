/**
 * A simple function that checks and converts data to json
 *
 * @returns The a json type data.
 */
export const parseJsonData = <T>(data: string): T => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (error) {
    throw new Error('Failed to parse JSON data.')
  }
}

/**
 * A simple function that checks and converts data to json
 *
 * @returns The a json type data.
 */
export const parseJsonData = <T>(data: any): T | null => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (error) {
    throw new Error('Invalid data: Must be a JSON string or an object')
  }
}
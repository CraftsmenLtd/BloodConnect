export const parseJsonData = <T>(data: string): T => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (_error) {
    throw new Error('Invalid data: Must be a JSON string or an object')
  }
}

export const parseJsonData = <T>(data: string): T => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error('Invalid data: Must be a JSON string or an object')
  }
}

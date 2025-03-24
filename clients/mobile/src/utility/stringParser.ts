export function stringToNumber (str: string): number {
  const num = Number(str)
  if (isNaN(num)) {
    throw new Error('Invalid number string')
  }
  return num
}

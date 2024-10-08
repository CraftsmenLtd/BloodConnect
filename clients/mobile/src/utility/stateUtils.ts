/* eslint-disable @typescript-eslint/prefer-reduce-type-parameter */
export const initializeState = <T extends Record<string, any>>(fields: Array<keyof T>, initialValue: any): T => {
  return fields.reduce((acc, field) => {
    acc[field] = initialValue
    return acc
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  }, {} as T)
}

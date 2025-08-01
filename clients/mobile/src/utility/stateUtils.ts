export const initializeState = <T extends Record<string, unknown>>(
  fields: Array<keyof T>,
  initialValue: T[keyof T]
): T => fields.reduce((acc, field) => {
    acc[field] = initialValue

    return acc
  }, {} as T)

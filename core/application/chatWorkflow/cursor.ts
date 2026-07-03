import { chatValidation } from './ChatOperationError'
import { HISTORY_PAGE_SIZE } from './Types'

export const encodeCursor = (key: Record<string, unknown>): string =>
  Buffer.from(JSON.stringify(key), 'utf-8').toString('base64')

export const decodeCursor = (encoded: string): Record<string, unknown> => {
  try {
    const json = Buffer.from(encoded, 'base64').toString('utf-8')
    const parsed: unknown = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('cursor is not an object')
    }

    return parsed as Record<string, unknown>
  } catch {
    throw chatValidation('Invalid cursor')
  }
}

export const clampLimit = (limit: number | undefined): number => {
  if (limit === undefined || Number.isNaN(limit)) {
    return HISTORY_PAGE_SIZE
  }

  return Math.min(Math.max(Math.floor(limit), 1), HISTORY_PAGE_SIZE)
}

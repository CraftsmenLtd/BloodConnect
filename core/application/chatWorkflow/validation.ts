import { MAX_MESSAGE_LENGTH } from './Types'
import { chatValidation } from './ChatOperationError'

const ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/
// channelId is composite: `<requestPostId>#<donorId>` — exactly two simple id segments
const CHANNEL_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}#[A-Za-z0-9._:-]{1,128}$/

const TAB = 0x09
const NEWLINE = 0x0a
const CARRIAGE_RETURN = 0x0d
const UNIT_SEPARATOR = 0x1f
const DELETE_CHAR = 0x7f

// Disallow ASCII control characters except tab, newline and carriage return.
const hasDisallowedControlChar = (value: string): boolean => {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0
    const isAllowedWhitespace = code === TAB || code === NEWLINE || code === CARRIAGE_RETURN
    if (!isAllowedWhitespace && (code <= UNIT_SEPARATOR || code === DELETE_CHAR)) {
      return true
    }
  }

  return false
}

export const isValidId = (value: unknown): value is string =>
  typeof value === 'string' && ID_PATTERN.test(value)

export const validateIds = (ids: Record<string, unknown>): void => {
  for (const [name, value] of Object.entries(ids)) {
    if (!isValidId(value)) {
      throw chatValidation(`Invalid identifier: ${name}`)
    }
  }
}

export const validateChannelId = (channelId: unknown): void => {
  if (typeof channelId !== 'string' || !CHANNEL_ID_PATTERN.test(channelId)) {
    throw chatValidation('Invalid channelId')
  }
}

export const validateBody = (body: unknown): string => {
  if (typeof body !== 'string') {
    throw chatValidation('Message body must be a string')
  }
  const trimmed = body.trim()
  if (trimmed.length === 0) {
    throw chatValidation('Message body must not be empty')
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw chatValidation(`Message body exceeds ${MAX_MESSAGE_LENGTH} characters`)
  }
  if (hasDisallowedControlChar(trimmed)) {
    throw chatValidation('Message body contains invalid control characters')
  }

  return trimmed
}

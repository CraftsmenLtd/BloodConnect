import { validateBody, validateChannelId, validateIds } from './validation'
import { chatValidation } from './ChatOperationError'

export type SendMessageFrame = {
  action: 'sendMessage';
  channelId: string;
  body: string;
  clientMessageId: string;
}
export type TypingFrame = { action: 'typing'; channelId: string }
export type MarkReadFrame = { action: 'markRead'; channelId: string }
export type InboundFrame = SendMessageFrame | TypingFrame | MarkReadFrame

const ACTIONS = ['sendMessage', 'typing', 'markRead']

export const validateInboundFrame = (value: unknown): InboundFrame => {
  if (typeof value !== 'object' || value === null) {
    throw chatValidation('Invalid message frame')
  }
  const frame = value as Record<string, unknown>
  const { action } = frame
  if (typeof action !== 'string' || !ACTIONS.includes(action)) {
    throw chatValidation('Unknown action')
  }
  validateChannelId(frame.channelId)
  const channelId = frame.channelId as string

  if (action === 'sendMessage') {
    const body = validateBody(frame.body)
    validateIds({ clientMessageId: frame.clientMessageId })

    return { action: 'sendMessage', channelId, body, clientMessageId: frame.clientMessageId as string }
  }
  if (action === 'typing') {
    return { action: 'typing', channelId }
  }

  return { action: 'markRead', channelId }
}

export const parseInboundFrame = (raw: string | null | undefined): InboundFrame => {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw chatValidation('Empty message frame')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw chatValidation('Malformed message frame')
  }

  return validateInboundFrame(parsed)
}

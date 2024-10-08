import { HasIdentifier } from './DTOCommon'

export type GenericMessage = { title: string; subtitle?: string; content: string }
export type NotificationMessage = HasIdentifier & GenericMessage

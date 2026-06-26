import { createHash } from 'crypto'
import {
  CHAT_MESSAGE_RETENTION_DAYS,
  CHAT_CONNECTION_TTL_HOURS
} from '../../../commons/libs/constants/NoMagicNumbers'

const SECONDS_PER_DAY = 86400
const SECONDS_PER_HOUR = 3600
const CHANNEL_ID_LENGTH = 32

/**
 * Deterministic channel id for a (seeker, requestPost, donor) triplet so that
 * stream-driven creation stays idempotent across redeliveries.
 */
export const buildChannelId = (
  seekerId: string,
  requestPostId: string,
  donorId: string
): string =>
  createHash('sha256')
    .update(`${seekerId}#${requestPostId}#${donorId}`)
    .digest('hex')
    .slice(0, CHANNEL_ID_LENGTH)

/** Epoch-seconds TTL value `days` from now, used for DynamoDB `expiresAt`. */
export const calculateExpiryEpoch = (
  days: number = CHAT_MESSAGE_RETENTION_DAYS
): number => Math.floor(Date.now() / 1000) + days * SECONDS_PER_DAY

/** Epoch-seconds TTL for a websocket connection registry row. */
export const calculateConnectionExpiry = (): number =>
  Math.floor(Date.now() / 1000) + CHAT_CONNECTION_TTL_HOURS * SECONDS_PER_HOUR

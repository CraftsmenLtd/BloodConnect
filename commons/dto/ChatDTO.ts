import type { BloodGroup, UrgencyType } from './DonationDTO'
import type { DTO } from './DTOCommon'

export enum ChatChannelStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED'
}

export enum ChatRole {
  SEEKER = 'SEEKER',
  DONOR = 'DONOR'
}

// channelId is the composite identity carried on membership and message items. Defined here in
// commons so both the framework-agnostic application layer and the AWS adapter layer share one
// source of truth (the application layer must not import the AWS-layer models).
export const buildChannelId = (seekerId: string, requestPostId: string, donorId: string): string =>
  `${seekerId}#${requestPostId}#${donorId}`

// Splits on the first two separators only, so the trailing donorId tolerates a '#' in the id; the
// seekerId and requestPostId fields must remain '#'-free (true for Cognito ids and ULIDs).
export const parseChannelId = (
  channelId: string
): { seekerId: string; requestPostId: string; donorId: string } => {
  const firstSeparator = channelId.indexOf('#')
  const secondSeparator = channelId.indexOf('#', firstSeparator + 1)

  return {
    seekerId: channelId.slice(0, firstSeparator),
    requestPostId: channelId.slice(firstSeparator + 1, secondSeparator),
    donorId: channelId.slice(secondSeparator + 1)
  }
}

// Request context snapshotted onto the channel at creation so the chat header
// renders on a cold-start deep-link without a separate post fetch.
export type ChatContextSnapshot = {
  requestedBloodGroup: BloodGroup;
  urgencyLevel: UrgencyType;
  donationDateTime: string;
  location: string;
}

// Canonical channel keyed by (seekerId, requestPostId, donorId). channelId is the
// composite `${seekerId}#${requestPostId}#${donorId}` carried on membership/message items.
export type ChatChannelDTO = DTO & {
  channelId: string;
  seekerId: string;
  requestPostId: string;
  donorId: string;
  status: ChatChannelStatus;
  context: ChatContextSnapshot;
  lastMessageAt?: string;
  createdAt: string;
}

// One per participant, so each user lists their own channels by base-table PK query.
// lastReadAt is the private per-user marker; unread is derived client-side from
// lastMessageAt vs lastReadAt (not a read receipt).
export type ChatMembershipDTO = DTO & {
  userId: string;
  channelId: string;
  role: ChatRole;
  lastReadAt?: string;
  lastMessageAt?: string;
  createdAt: string;
}

// messageId is a time-ordered key (ULID/ISO) used as the sort key for newest-first paging.
export type ChatMessageDTO = DTO & {
  channelId: string;
  messageId: string;
  senderId: string;
  content: string;
  ttl?: number;
  createdAt: string;
}

// Live WebSocket connection, keyed by connectionId; GSI1 on userId for fanout.
export type ChatConnectionDTO = DTO & {
  connectionId: string;
  userId: string;
  createdAt: string;
}

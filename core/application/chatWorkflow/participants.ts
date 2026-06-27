import { NotParticipantError } from './ChatErrors'

// channelId is `<seekerId>#<requestPostId>#<donorId>` (architecture §Data model).
// Participants are derived from the id itself, never trusted from the client.
const CHANNEL_ID_SEPARATOR = '#'
const MIN_CHANNEL_ID_PARTS = 3

export type ChannelParticipants = {
  seekerId: string;
  donorId: string;
}

const isBlank = (value: string): boolean => value === ''

export const deriveParticipants = (channelId: string): ChannelParticipants => {
  const parts = channelId.split(CHANNEL_ID_SEPARATOR)
  const seekerId = parts[0]
  const donorId = parts[parts.length - 1]
  if (parts.length < MIN_CHANNEL_ID_PARTS || isBlank(seekerId) || isBlank(donorId)) {
    throw new NotParticipantError('Malformed channel id')
  }

  return { seekerId, donorId }
}

export const assertParticipant = (channelId: string, userId: string): void => {
  const { seekerId, donorId } = deriveParticipants(channelId)
  if (userId !== seekerId && userId !== donorId) {
    throw new NotParticipantError()
  }
}

export const getRecipient = (channelId: string, senderId: string): string => {
  const { seekerId, donorId } = deriveParticipants(channelId)

  return senderId === seekerId ? donorId : seekerId
}

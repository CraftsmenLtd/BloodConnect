import type { ValidationRule } from '../utils/validator'
import { validateChatMessageContent } from '../utils/validator'
import type { BloodGroup } from '../../../commons/dto/DonationDTO'

export type CreateChatChannelAttributes = {
  seekerId: string;
  requestPostId: string;
  donorId: string;
  requestedBloodGroup?: BloodGroup;
}

export type SendChatMessageAttributes = {
  channelId: string;
  senderId: string;
  content: string;
}

export type RegisterConnectionAttributes = {
  connectionId: string;
  userId: string;
}

export const sendChatMessageValidationRules: Record<
keyof Pick<SendChatMessageAttributes, 'content'>,
Array<ValidationRule<unknown>>
> = {
  content: [validateChatMessageContent as ValidationRule<unknown>]
}

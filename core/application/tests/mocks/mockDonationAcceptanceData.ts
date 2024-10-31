import { AcceptDonationRequestAttributes } from '../../../application/bloodDonationWorkflow/Types'

const getISODate = (daysToAdd: number = 0): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysToAdd)
  return date.toISOString()
}

export const acceptDonationRequestAttributesMock: AcceptDonationRequestAttributes = {
  donorId: 'testDonorId123',
  seekerId: 'testSeekerId456',
  createdAt: getISODate(),
  requestPostId: 'testRequestPostId789',
  acceptanceTime: getISODate(1)
}

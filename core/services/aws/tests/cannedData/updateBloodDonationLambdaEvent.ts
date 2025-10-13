import type { UpdateBloodDonationAttributes } from '../../../../application/bloodDonationWorkflow/Types'

export const mockEvent: UpdateBloodDonationAttributes = {
  requestPostId: 'requestPost123',
  seekerId: 'seeker456',
  bloodQuantity: 3,
  donationDateTime: new Date(Date.now() + 3600000).toISOString(),
  contactNumber: '+880123456789',
  createdAt: new Date(Date.now()).toISOString()
}

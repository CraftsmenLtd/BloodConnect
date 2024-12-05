import { StepFunctionExecutionAttributes, StepFunctionInput } from '../../bloodDonationWorkflow/Types'

export const startExecutionInputMock: StepFunctionInput = {
  seekerId: 'seeker123',
  requestPostId: 'req123',
  requestedBloodGroup: 'O-' as const,
  bloodQuantity: 2,
  urgencyLevel: 'urgent' as const,
  donationDateTime: '2024-10-20T15:00:00Z',
  geohash: 'wvjytdh',
  city: 'Dhaka',
  createdAt: '2024-10-20T15:00:00.324Z',
  patientName: 'John Doe',
  location: 'Baridhara, Dhaka',
  transportationInfo: 'transportation Info',
  shortDescription: 'short Description',
  retryCount: 1,
  seekerName: 'test name',
  contactNumber: '01712345678',
  message: 'test message'
}

export const startExecutionOutputMock: StepFunctionExecutionAttributes = {
  executionArn: 'arn:aws:states:us-east-1:123456789012:execution:donorRouting:execution-id-123',
  status: 'RUNNING',
  startDate: '2024-10-10T00:00:00Z',
  input: startExecutionInputMock
}

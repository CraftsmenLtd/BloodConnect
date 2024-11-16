import { SQSEvent, SQSRecord } from 'aws-lambda'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import { DonorRoutingAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { DonationDTO, DonorSearchDTO } from '../../../../commons/dto/DonationDTO'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import { BloodDonationModel, DonationFields } from '../../../application/Models/dbModels/BloodDonationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import StepFunctionOperations from '../commons/stepFunction/StepFunctionOperations'
import { DonorSearchFields, DonorSearchModel } from '../../../application/Models/dbModels/DonorSearchModel'
import UserModel, { UserFields } from '../../../application/Models/dbModels/UserModel'

const bloodDonationService = new BloodDonationService()

async function donorRequestRouter(event: SQSEvent): Promise<{ status: string }> {
  try {
    for (const record of event.Records) {
      await processSQSRecord(record)
    }
    return { status: 'Success' }
  } catch (error) {
    throw error instanceof Error ? error : new Error('An unknown error occurred')
  }
}

async function processSQSRecord(record: SQSRecord): Promise<void> {
  const body = typeof record.body === 'string' && record.body.trim() !== ''
    ? JSON.parse(record.body)
    : {}

  const primaryIndex: string = body?.PK
  const secondaryIndex: string = body?.SK
  if (primaryIndex === '' || secondaryIndex === '') {
    throw new Error('Missing PK or SK in the DynamoDB record')
  }

  const donorRoutingAttributes: DonorRoutingAttributes = {
    seekerId: primaryIndex.split('#')[1],
    requestPostId: secondaryIndex.split('#')[2],
    createdAt: secondaryIndex.split('#')[1]
  }

  await bloodDonationService.routeDonorRequest(
    donorRoutingAttributes,
    new DynamoDbTableOperations<DonationDTO, DonationFields, BloodDonationModel>(new BloodDonationModel()),
    new StepFunctionOperations(),
    new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(new DonorSearchModel()),
    new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel())
  )
}

export default donorRequestRouter

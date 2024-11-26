import { SQSEvent, SQSRecord } from 'aws-lambda'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import { DonorRoutingAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { DonorSearchDTO } from '../../../../commons/dto/DonationDTO'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'

import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import StepFunctionOperations from '../commons/stepFunction/StepFunctionOperations'
import {
  DonorSearchFields,
  DonorSearchModel
} from '../../../application/models/dbModels/DonorSearchModel'
import UserModel, { UserFields } from '../../../application/models/dbModels/UserModel'
import { UserService } from '../../../application/userWorkflow/UserService'

const bloodDonationService = new BloodDonationService()
const userService = new UserService()

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
  const body =
    typeof record.body === 'string' && record.body.trim() !== '' ? JSON.parse(record.body) : {}

  const primaryIndex: string = body?.PK
  const secondaryIndex: string = body?.SK
  if (primaryIndex === '' || secondaryIndex === '') {
    throw new Error('Missing PK or SK in the DynamoDB record')
  }

  const donorRoutingAttributes: DonorRoutingAttributes = {
    seekerId: primaryIndex.split('#')[1],
    requestPostId: secondaryIndex.split('#')[2],
    createdAt: secondaryIndex.split('#')[1],
    neededBloodGroup: body.neededBloodGroup,
    bloodQuantity: body.bloodQuantity,
    urgencyLevel: body.urgencyLevel,
    city: body.city,
    location: body.location,
    patientName: body.patientName,
    geohash: body.geohash,
    donationDateTime: body.donationDateTime,
    contactNumber: body.contactNumber,
    transportationInfo: body.transportationInfo,
    shortDescription: body.shortDescription
  }

  const userProfile = await userService.getUser(
    donorRoutingAttributes.seekerId,
    new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(
      new UserModel()
    )
  )

  await bloodDonationService.routeDonorRequest(
    donorRoutingAttributes,
    record.eventSourceARN,
    userProfile,
    new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
      new DonorSearchModel()
    ),
    new StepFunctionOperations()
  )
}

export default donorRequestRouter

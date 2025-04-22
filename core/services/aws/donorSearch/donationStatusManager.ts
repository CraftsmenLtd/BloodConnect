import type { SQSEvent, SQSRecord } from 'aws-lambda'
import { BloodDonationService } from 'application/bloodDonationWorkflow/BloodDonationService'
import type {
  AcceptedDonationDTO,
  DonationDTO
} from '../../../../commons/dto/DonationDTO'
import {
  DonationStatus
} from '../../../../commons/dto/DonationDTO'
import type {
  DonationFields
} from 'application/models/dbModels/BloodDonationModel'
import {
  BloodDonationModel
} from 'application/models/dbModels/BloodDonationModel'
import type {
  AcceptedDonationFields
} from 'application/models/dbModels/AcceptDonationModel';
import {
  AcceptDonationRequestModel
} from 'application/models/dbModels/AcceptDonationModel'
import AcceptedDonationDynamoDbOperations from '../commons/ddb/AcceptedDonationDynamoDbOperations'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'
import {
  AcceptDonationService
} from 'core/application/bloodDonationWorkflow/AcceptDonationRequestService'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'

const bloodDonationService = new BloodDonationService()
const acceptDonationService = new AcceptDonationService()

async function donationStatusManager(event: SQSEvent): Promise<{ status: string }> {
  try {
    for (const record of event.Records) {
      await processSQSRecord(record)
    }
    return { status: 'Success' }
  } catch (error) {
    throw error instanceof Error ? error : new Error(UNKNOWN_ERROR_MESSAGE)
  }
}

async function processSQSRecord(record: SQSRecord): Promise<void> {
  const body =
    typeof record.body === 'string' && record.body.trim() !== '' ? JSON.parse(record.body) : {}

  const primaryIndex: string = body?.PK
  const secondaryIndex: string = body?.SK
  const createdAt: string = body?.createdAt
  if (primaryIndex === '' || secondaryIndex === '') {
    throw new Error('Missing PK or SK in the DynamoDB record')
  }

  const seekerId = primaryIndex.split('#')[1]
  const requestPostId = secondaryIndex.split('#')[1]

  const donationPost = await bloodDonationService.getDonationRequest(
    seekerId,
    requestPostId,
    createdAt,
    new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
      new BloodDonationModel()
    )
  )

  const acceptedDonors = await acceptDonationService.getAcceptedDonorList(
    seekerId,
    requestPostId,
    new AcceptedDonationDynamoDbOperations<
    AcceptedDonationDTO,
    AcceptedDonationFields,
    AcceptDonationRequestModel
    >(new AcceptDonationRequestModel())
  )

  if (acceptedDonors.length >= donationPost.bloodQuantity) {
    await bloodDonationService.updateDonationStatus(
      seekerId,
      requestPostId,
      createdAt,
      DonationStatus.MANAGED,
      new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
        new BloodDonationModel()
      )
    )
  }
}

export default donationStatusManager

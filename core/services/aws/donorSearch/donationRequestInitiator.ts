import type { SQSEvent } from 'aws-lambda'
import {
  DonorSearchService
} from 'application/bloodDonationWorkflow/DonorSearchService'
import type {
  DonationRequestInitiatorAttributes,
  DonorSearchConfig,
} from 'application/bloodDonationWorkflow/Types'
import {
  UserService
} from 'application/userWorkflow/UserService'
import SQSOperations from '../commons/sqs/SQSOperations'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import {
  DonorSearchIntentionalError
} from 'application/bloodDonationWorkflow/DonorSearchOperationalError'
import { Config } from 'commons/libs/config/config';
import UserDynamoDbOperations from '../commons/ddbOperations/UserDynamoDbOperations';
import DonorSearchDynamoDbOperations from '../commons/ddbOperations/DonorSearchDynamoDbOperations';

const config = new Config<DonorSearchConfig>().getConfig()

const donorSearchDynamoDbOperations = new DonorSearchDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

const userDynamoDbOperations = new UserDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function donationRequestInitiatorLambda(event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    const body =
      typeof record.body === 'string' &&
      record.body.trim() !== '' ? JSON.parse(record.body) : {}

    const primaryIndex: string = body?.PK
    const secondaryIndex: string = body?.SK
    const seekerId = primaryIndex.split('#')[1]
    const requestPostId = secondaryIndex.split('#')[2]
    const createdAt = secondaryIndex.split('#')[1]
    const serviceLogger = createServiceLogger(seekerId, { requestPostId, createdAt })

    const userService = new UserService(
      userDynamoDbOperations,
      serviceLogger
    )
    const donorSearchService = new DonorSearchService(
      donorSearchDynamoDbOperations,
      serviceLogger,
      config
    )

    try {

      const donationRequestInitiatorAttributes: DonationRequestInitiatorAttributes = {
        seekerId,
        requestPostId,
        createdAt,
        requestedBloodGroup: body.requestedBloodGroup,
        bloodQuantity: Number(body.bloodQuantity),
        urgencyLevel: body.urgencyLevel,
        countryCode: body.countryCode,
        location: body.location,
        patientName: body.patientName,
        status: body.status,
        geohash: body.geohash,
        donationDateTime: body.donationDateTime,
        contactNumber: body.contactNumber,
        transportationInfo: body.transportationInfo,
        shortDescription: body.shortDescription,
        eventName: body.eventName
      }

      await donorSearchService.initiateDonorSearchRequest(
        donationRequestInitiatorAttributes,
        userService,
        new SQSOperations()
      )

    } catch (error) {
      serviceLogger.error(error instanceof DonorSearchIntentionalError ? error.message : error)
      throw error
    }
  }
}

export default donationRequestInitiatorLambda

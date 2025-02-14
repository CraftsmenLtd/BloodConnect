import { SQSEvent } from 'aws-lambda'
import { DonorSearchService } from '../../../application/bloodDonationWorkflow/DonorSearchService'
import {
  DonorSearchAttributes,
  DonorSearchQueueAttributes
} from '../../../application/bloodDonationWorkflow/Types'
import { DonorSearchDTO, DonorSearchStatus, DynamoDBEventName } from '../../../../commons/dto/DonationDTO'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'

import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import {
  DonorSearchFields,
  DonorSearchModel
} from '../../../application/models/dbModels/DonorSearchModel'
import UserModel, { UserFields } from '../../../application/models/dbModels/UserModel'
import { UserService } from '../../../application/userWorkflow/UserService'
import SQSOperations from '../commons/sqs/SQSOperations'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import { DonorSearchIntentionalError } from '../../../application/bloodDonationWorkflow/DonorSearchOperationalError'

const donorSearchService = new DonorSearchService()
const userService = new UserService()

async function donationRequestInitiator(event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    const body =
      typeof record.body === 'string' && record.body.trim() !== '' ? JSON.parse(record.body) : {}

    const primaryIndex: string = body?.PK
    const secondaryIndex: string = body?.SK
    const seekerId = primaryIndex.split('#')[1]
    const requestPostId = secondaryIndex.split('#')[2]
    const createdAt = secondaryIndex.split('#')[1]
    const serviceLogger = createServiceLogger(seekerId, { requestPostId, createdAt })

    try {
      const userProfile = await userService.getUser(
        primaryIndex.split('#')[1],
        new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel())
      )

      const donorSearchAttributes: DonorSearchAttributes = {
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.PENDING,
        requestedBloodGroup: body.requestedBloodGroup,
        bloodQuantity: body.bloodQuantity,
        urgencyLevel: body.urgencyLevel,
        city: body.city,
        location: body.location,
        patientName: body.patientName,
        seekerName: userProfile.name,
        geohash: body.geohash,
        donationDateTime: body.donationDateTime,
        contactNumber: body.contactNumber,
        transportationInfo: body.transportationInfo,
        shortDescription: body.shortDescription,
        notifiedEligibleDonors: {}
      }

      const donorSearchQueueAttributes: DonorSearchQueueAttributes = {
        seekerId,
        requestPostId,
        createdAt,
        currentNeighborSearchLevel: 0,
        remainingGeohashesToProcess: [
          body.geohash.slice(0, Number(process.env.NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH))
        ],
        notifiedEligibleDonors: {},
        retryCount: 0,
        reinstatedRetryCount: 0
      }

      const donorSearchRecord = await donorSearchService.getDonorSearchRecord(
        seekerId,
        requestPostId,
        createdAt,
        new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
          new DonorSearchModel()
        )
      )

      const shouldRestartSearch =
        body.eventName === DynamoDBEventName.MODIFY &&
        donorSearchRecord !== null &&
        donorSearchRecord.status === DonorSearchStatus.COMPLETED

      if (donorSearchRecord === null) {
        serviceLogger.info('inserting donor search record')
        await donorSearchService.createDonorSearchRecord(
          donorSearchAttributes,
          new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
            new DonorSearchModel()
          )
        )

        serviceLogger.info('Starting donor search request')
        await donorSearchService.enqueueDonorSearchRequest(
          donorSearchQueueAttributes,
          new SQSOperations()
        )
        return
      } else {
        serviceLogger.info('updating donor search record')
        await donorSearchService.updateDonorSearchRecord(
          {
            ...donorSearchAttributes,
            status: shouldRestartSearch ? DonorSearchStatus.PENDING : donorSearchRecord.status
          },
          new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
            new DonorSearchModel()
          )
        )
      }

      if (shouldRestartSearch) {
        serviceLogger.info('Restarting donor search request')
        await donorSearchService.enqueueDonorSearchRequest(
          {
            ...donorSearchQueueAttributes,
            notifiedEligibleDonors: donorSearchRecord.notifiedEligibleDonors
          },
          new SQSOperations()
        )
      }
    } catch (error) {
      serviceLogger.error(error instanceof DonorSearchIntentionalError ? error.message : error)
      throw error
    }
  }
}

export default donationRequestInitiator

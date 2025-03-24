import type { SQSEvent } from 'aws-lambda'
import { DonorSearchService } from '../../../application/bloodDonationWorkflow/DonorSearchService'
import type {
  DonorSearchAttributes,
  DonorSearchQueueAttributes
} from '../../../application/bloodDonationWorkflow/Types'
import type { DonorSearchDTO} from '../../../../commons/dto/DonationDTO';
import { DonorSearchStatus } from '../../../../commons/dto/DonationDTO'
import type { UserDetailsDTO } from '../../../../commons/dto/UserDTO'

import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import type {
  DonorSearchFields} from '../../../application/models/dbModels/DonorSearchModel';
import {
  DonorSearchModel
} from '../../../application/models/dbModels/DonorSearchModel'
import type { UserFields } from '../../../application/models/dbModels/UserModel';
import UserModel from '../../../application/models/dbModels/UserModel'
import { UserService } from '../../../application/userWorkflow/UserService'
import SQSOperations from '../commons/sqs/SQSOperations'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import { DonorSearchIntentionalError } from '../../../application/bloodDonationWorkflow/DonorSearchOperationalError'

export enum DynamoDBEventName {
  INSERT = 'INSERT',
  MODIFY = 'MODIFY'
}

const donorSearchService = new DonorSearchService()
const userService = new UserService()

async function donationRequestInitiator (event: SQSEvent): Promise<void> {
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
        bloodQuantity: Number(body.bloodQuantity),
        urgencyLevel: body.urgencyLevel,
        countryCode: body.countryCode,
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
        initiationCount: 1
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
      } else {
        serviceLogger.info('updating donor search record because the donation request has been updated')
        await donorSearchService.updateDonorSearchRecord(
          {
            ...donorSearchAttributes,
            status: shouldRestartSearch ? DonorSearchStatus.PENDING : donorSearchRecord.status,
            notifiedEligibleDonors: donorSearchRecord.notifiedEligibleDonors
          },
          new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
            new DonorSearchModel()
          )
        )
      }

      if (shouldRestartSearch) {
        donorSearchQueueAttributes.notifiedEligibleDonors = donorSearchRecord.notifiedEligibleDonors
      }

      serviceLogger.info('starting donor search request')
      await donorSearchService.enqueueDonorSearchRequest(
        donorSearchQueueAttributes,
        new SQSOperations()
      )
    } catch (error) {
      serviceLogger.error(error instanceof DonorSearchIntentionalError ? error.message : error)
      throw error
    }
  }
}

export default donationRequestInitiator

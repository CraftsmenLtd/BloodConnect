import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import BloodDonationOperationError from './BloodDonationOperationError'
import ThrottlingError from './ThrottlingError'
import type { DonationDTO } from '../../../commons/dto/DonationDTO'
import { DonationStatus } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import { generateGeohash } from '../utils/geohash'
import { validateInputWithRules } from '../utils/validator'
import {
  type BloodDonationAttributes,
  type UpdateBloodDonationAttributes,
  type BloodDonationResponseAttributes,
  type BloodDonationEventAttributes,
  validationRules
} from './Types'
import { THROTTLING_LIMITS } from '../../../commons/libs/constants/ThrottlingLimits'
import type BloodDonationRepository from '../models/policies/repositories/BloodDonationRepository'
import type { UserService } from '../userWorkflow/UserService'
import type { Logger } from '../models/logger/Logger'
import type { NotificationService } from '../notificationWorkflow/NotificationService'
import type { DonationRequestPayloadAttributes } from '../notificationWorkflow/Types'

export class BloodDonationService {
  constructor(
    protected readonly bloodDonationRepository: BloodDonationRepository,
    protected readonly logger: Logger
  ) {}

  async createBloodDonation(
    donationEventAttributes: BloodDonationEventAttributes,
    userService: UserService
  ): Promise<BloodDonationResponseAttributes> {
    const userProfile = await userService.getUser(donationEventAttributes.seekerId)
    const bloodDonationAttributes: BloodDonationAttributes = {
      ...donationEventAttributes,
      seekerName: userProfile.name,
      countryCode: userProfile.countryCode
    }

    this.logger.info('checking daily request limit')
    await this.checkDailyRequestThrottling(
      bloodDonationAttributes.seekerId
    )

    this.logger.info('validating donation request')
    const validationResponse = validateInputWithRules(
      {
        bloodQuantity: bloodDonationAttributes.bloodQuantity,
        donationDateTime: bloodDonationAttributes.donationDateTime
      },
      validationRules
    )
    if (validationResponse !== null) {
      throw new BloodDonationOperationError(
        `Invalid parameters for blood donation request. ${validationResponse}`,
        GENERIC_CODES.BAD_REQUEST
      )
    }

    this.logger.info('creating donation request')
    const response: DonationDTO = await this.bloodDonationRepository
      .create({
        requestPostId: generateUniqueID(),
        ...bloodDonationAttributes,
        status: DonationStatus.PENDING,
        geohash: generateGeohash(
          bloodDonationAttributes.latitude,
          bloodDonationAttributes.longitude
        ),
        donationDateTime: new Date(bloodDonationAttributes.donationDateTime).toISOString(),
        createdAt: new Date().toISOString()
      })
      .catch((error) => {
        if (error instanceof ThrottlingError) {
          throw error
        }
        throw new BloodDonationOperationError(
          `Failed to submit blood donation request. ${error}`,
          GENERIC_CODES.ERROR
        )
      })

    return {
      requestPostId: response.requestPostId,
      createdAt: response.createdAt
    }
  }

  private async checkDailyRequestThrottling(seekerId: string): Promise<void> {
    const datePrefix = new Date().toISOString().split('T')[0]
    try {
      const queryResult = await this.bloodDonationRepository.getDonationRequestsByDate(
        seekerId,
        datePrefix
      )
      if (
        queryResult !== null &&
        queryResult.length >= THROTTLING_LIMITS.BLOOD_REQUEST.MAX_REQUESTS_PER_DAY
      ) {
        throw new ThrottlingError(
          THROTTLING_LIMITS.BLOOD_REQUEST.ERROR_MESSAGE,
          GENERIC_CODES.TOO_MANY_REQUESTS
        )
      }
    } catch (error) {
      if (error instanceof ThrottlingError) {
        throw error
      }
      throw new BloodDonationOperationError(
        `Failed to check request limits: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async getDonationRequest(
    seekerId: string,
    requestPostId: string,
    createdAt: string
  ): Promise<DonationDTO> {
    const item = await this.bloodDonationRepository.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )
    if (item === null) {
      throw new Error('Donation not found.')
    }
    return item
  }

  async updateBloodDonation(
    donationAttributes: UpdateBloodDonationAttributes,
    notificationService: NotificationService,
    logger: Logger
  ): Promise<BloodDonationResponseAttributes> {
    const { seekerId, requestPostId, donationDateTime, createdAt, ...restAttributes } =
      donationAttributes
    const item = await this.bloodDonationRepository.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )

    if (item === null) {
      throw new BloodDonationOperationError('Item not found.', GENERIC_CODES.NOT_FOUND)
    }

    logger.info('checking donation status')
    if (item?.status !== undefined && item.status === DonationStatus.CANCELLED) {
      throw new BloodDonationOperationError(
        'You can\'t update a cancelled request',
        GENERIC_CODES.ERROR
      )
    }

    const updateData: Partial<DonationDTO> = {
      ...restAttributes,
      seekerId,
      requestPostId,
      createdAt
    }

    logger.info('validating donation request')
    if (donationDateTime !== undefined) {
      const validationResponse = validateInputWithRules({ donationDateTime }, validationRules)
      if (validationResponse !== null) {
        throw new Error(validationResponse)
      }
      updateData.donationDateTime = new Date(donationDateTime).toISOString()
    }

    logger.info('updating donation request')
    await this.bloodDonationRepository.update(updateData).catch((error) => {
      if (error instanceof BloodDonationOperationError) {
        throw error
      }
      throw new BloodDonationOperationError(
        `Failed to update blood donation post. ${error}`,
        GENERIC_CODES.ERROR
      )
    })

    logger.info('updating donation notifications')
    await notificationService.updateBloodDonationNotifications(
      requestPostId,
      donationAttributes as Partial<DonationRequestPayloadAttributes>
    )

    return {
      requestPostId,
      createdAt
    }
  }

  async updateDonationStatus(
    seekerId: string,
    requestPostId: string,
    createdAt: string,
    status: DonationStatus,
    bloodDonationRepository: BloodDonationRepository
  ): Promise<void> {
    const item = await bloodDonationRepository.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )
    if (item === null) {
      throw new Error('Donation not found.')
    }
    const updateData: Partial<DonationDTO> = {
      ...item,
      seekerId,
      requestPostId,
      createdAt,
      status
    }
    await bloodDonationRepository.update(updateData)
  }
}

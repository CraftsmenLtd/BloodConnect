import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import AcceptDonationRequestError from './AcceptDonationRequestError'
import type { AcceptDonationRequestAttributes } from './Types'
import type AcceptDonationRepository from '../models/policies/repositories/AcceptDonationRepository'
import type { AcceptDonationDTO, DonationDTO } from '../../../commons/dto/DonationDTO'
import { AcceptDonationStatus, DonationStatus } from '../../../commons/dto/DonationDTO'
import type { Logger } from '../models/logger/Logger'
import { calculateRemainingBagsNeeded } from '../utils/calculateDonorsToNotify'
import type { BloodDonationService } from './BloodDonationService'
import type { NotificationService } from '../notificationWorkflow/NotificationService'
import type { UserService } from '../userWorkflow/UserService'
import type { UserDetailsDTO } from 'commons/dto/UserDTO'
import type { DonationNotificationAttributes } from '../notificationWorkflow/Types'
import { NotificationType } from 'commons/dto/NotificationDTO'
import type { QueueModel } from '../models/queue/QueueModel'

export class AcceptDonationService {
  constructor(
    protected readonly acceptDonationRepository: AcceptDonationRepository,
    protected readonly logger: Logger
  ) {}

  async acceptDonationRequest(
    donorId: string,
    seekerId: string,
    requestPostId: string,
    createdAt: string,
    status: AcceptDonationStatus,
    bloodDonationService: BloodDonationService,
    userService: UserService,
    notificationService: NotificationService,
    queueModel: QueueModel
  ): Promise<void> {
    if (![AcceptDonationStatus.ACCEPTED, AcceptDonationStatus.IGNORED].includes(status)) {
      throw new Error('Invalid status for donation response.')
    }

    const acceptanceRecord = await this.getAcceptanceRecord(seekerId, requestPostId, donorId)
    if (this.isAlreadyDonated(acceptanceRecord)) {
      throw new Error('You already donated.')
    }

    const donorProfile = await userService.getUser(donorId)
    const seekerProfile = await userService.getUser(seekerId)
    const donationPost = await bloodDonationService.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )
    if (donorProfile.bloodGroup !== donationPost.requestedBloodGroup) {
      throw new Error('Your blood group doesn\'t match with the request blood group')
    }
    if (donationPost.status !== DonationStatus.PENDING) {
      throw new Error('Donation request is no longer available for acceptance.')
    }

    if (acceptanceRecord === null) {
      if (status === AcceptDonationStatus.ACCEPTED) {
        await this.createAcceptanceRecord(donorId, seekerId, createdAt, requestPostId, donorProfile)
        await this.sendNotificationToSeeker(
          notificationService,
          queueModel,
          seekerId,
          requestPostId,
          donationPost,
          donorId,
          createdAt,
          status,
          donorProfile
        )
      }
    } else {
      if (status === AcceptDonationStatus.IGNORED) {
        await this.acceptDonationRepository.deleteAcceptedRequest(seekerId, requestPostId, donorId)
      }
      if (status !== acceptanceRecord.status) {
        await this.sendNotificationToSeeker(
          notificationService,
          queueModel,
          seekerId,
          requestPostId,
          donationPost,
          donorId,
          createdAt,
          status,
          donorProfile
        )
      }
    }

    await this.updateDonationNotification(
      notificationService,
      donorId,
      requestPostId,
      seekerId,
      createdAt,
      status,
      donationPost,
      seekerProfile
    )
  }

  async createAcceptanceRecord(
    donorId: string,
    seekerId: string,
    createdAt: string,
    requestPostId: string,
    donorProfile: UserDetailsDTO
  ): Promise<void> {
    const acceptDonationRequestAttributes: AcceptDonationRequestAttributes = {
      donorId,
      seekerId,
      createdAt,
      requestPostId,
      status: AcceptDonationStatus.ACCEPTED,
      donorName: donorProfile?.name,
      phoneNumbers: donorProfile?.phoneNumbers
    }

    const acceptanceRecord: AcceptDonationDTO = {
      ...acceptDonationRequestAttributes,
      acceptanceTime: new Date().toISOString()
    }
    await this.acceptDonationRepository.create(acceptanceRecord).catch(() => {
      throw new AcceptDonationRequestError('Failed to accept donation request', GENERIC_CODES.ERROR)
    })
  }

  async updateAcceptanceRecord(
    acceptDonationRequestAttributes: AcceptDonationRequestAttributes
  ): Promise<void> {
    await this.acceptDonationRepository.update(acceptDonationRequestAttributes).catch(() => {
      throw new AcceptDonationRequestError(
        'Failed to update accept donation request',
        GENERIC_CODES.ERROR
      )
    })
  }

  async updateAcceptanceRecordStatus(
    seekerId: string,
    requestPostId: string,
    donorId: string,
    status: AcceptDonationStatus
  ): Promise<void> {
    const updateData: Partial<AcceptDonationDTO> = {
      seekerId,
      requestPostId,
      donorId,
      status
    }
    await this.acceptDonationRepository.update(updateData).catch(() => {
      throw new AcceptDonationRequestError(
        'Failed to update accept donation request',
        GENERIC_CODES.ERROR
      )
    })
  }

  async getAcceptanceRecord(
    seekerId: string,
    requestPostId: string,
    donorId: string
  ): Promise<AcceptDonationDTO | null> {
    const item = await this.acceptDonationRepository.getAcceptedRequest(
      seekerId,
      requestPostId,
      donorId
    )
    return item
  }

  async getAcceptedDonorList(
    seekerId: string,
    requestPostId: string
  ): Promise<AcceptDonationDTO[]> {
    const queryResult = await this.acceptDonationRepository.queryAcceptedRequests(
      seekerId,
      requestPostId
    )
    return queryResult ?? []
  }

  async getRemainingBagsNeeded(
    seekerId: string,
    requestPostId: string,
    bloodQuantity: number
  ): Promise<number> {
    const acceptedDonors = await this.getAcceptedDonorList(seekerId, requestPostId)
    return calculateRemainingBagsNeeded(bloodQuantity, acceptedDonors.length)
  }

  isAlreadyDonated(acceptanceRecord: AcceptDonationDTO | null): boolean {
    return acceptanceRecord != null && acceptanceRecord.status === AcceptDonationStatus.COMPLETED
  }

  async sendNotificationToSeeker(
    notificationService: NotificationService,
    queueModel: QueueModel,
    seekerId: string,
    requestPostId: string,
    donationPost: DonationDTO,
    donorId: string,
    createdAt: string,
    status: AcceptDonationStatus,
    donorProfile: UserDetailsDTO
  ): Promise<void> {
    const acceptedDonors = await this.getAcceptedDonorList(seekerId, requestPostId)

    const notificationAttributes: DonationNotificationAttributes = {
      userId: seekerId,
      title: status === AcceptDonationStatus.ACCEPTED ? 'Donor Found' : 'Donor Ignored',
      status,
      body:
        status === AcceptDonationStatus.ACCEPTED
          ? `${donationPost.requestedBloodGroup} blood found`
          : 'request was ignored by donor',
      type: NotificationType.REQ_ACCEPTED,
      payload: {
        donorId,
        seekerId,
        createdAt,
        requestPostId,
        donorName: donorProfile?.name,
        phoneNumbers: donorProfile?.phoneNumbers,
        requestedBloodGroup: donationPost.requestedBloodGroup,
        bloodQuantity: donationPost.bloodQuantity,
        urgencyLevel: donationPost.urgencyLevel,
        location: donationPost.location,
        donationDateTime: donationPost.donationDateTime,
        shortDescription: donationPost.shortDescription,
        acceptedDonors
      }
    }

    await notificationService.sendNotification(notificationAttributes, queueModel)
  }

  async updateDonationNotification(
    notificationService: NotificationService,
    donorId: string,
    requestPostId: string,
    seekerId: string,
    createdAt: string,
    status: AcceptDonationStatus,
    donationPost: DonationDTO,
    seekerProfile: UserDetailsDTO
  ): Promise<void> {
    const existingNotification = await notificationService.getBloodDonationNotification(
      donorId,
      requestPostId,
      NotificationType.BLOOD_REQ_POST
    )

    if (existingNotification === null) {
      if (status === AcceptDonationStatus.ACCEPTED) {
        const notificationData: DonationNotificationAttributes = {
          type: NotificationType.BLOOD_REQ_POST,
          payload: {
            seekerId,
            requestPostId,
            createdAt,
            bloodQuantity: donationPost.bloodQuantity,
            requestedBloodGroup: donationPost.requestedBloodGroup as string,
            urgencyLevel: donationPost.urgencyLevel as string,
            contactNumber: donationPost.contactNumber,
            donationDateTime: donationPost.donationDateTime,
            patientName: donationPost.patientName as string,
            seekerName: seekerProfile.name,
            location: donationPost.location,
            shortDescription: donationPost.shortDescription as string,
            transportationInfo: donationPost.transportationInfo as string
          },
          status: status as AcceptDonationStatus,
          userId: donorId,
          title: 'Blood Request Accepted',
          body: `${donationPost.requestedBloodGroup} blood request Accepted`
        }

        await notificationService.createBloodDonationNotification(notificationData)
      }
    } else {
      await notificationService.updateBloodDonationNotificationStatus(
        donorId,
        requestPostId,
        NotificationType.BLOOD_REQ_POST,
        status
      )
    }
  }
}

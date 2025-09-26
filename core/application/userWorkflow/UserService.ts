import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import UserOperationError from './UserOperationError'
import type { LocationDTO, UserDetailsDTO, UserDTO } from '../../../commons/dto/UserDTO'
import { generateUniqueID } from '../utils/idGenerator'
import type { GenericMessage } from '../../../commons/dto/MessageDTO'
import {
  getAppUserWelcomeMailMessage,
  getEmailVerificationMessage,
  getPasswordResetVerificationMessage
} from './userMessages'
import type Repository from '../models/policies/repositories/Repository'
import type { CreateUserAttributes, UpdateUserAttributes, UserAttributes } from './Types'
import { differenceInMonths, differenceInYears } from 'date-fns'
import type { Logger } from '../models/logger/Logger'
import type UserRepository from '../models/policies/repositories/UserRepository'
import type { LocationService } from './LocationService'
import type { StoreNotificationEndPoint } from '../notificationWorkflow/Types'

export class UserService {
  constructor(
    protected readonly userRepository: UserRepository,
    protected readonly logger: Logger
  ) { }

  async createNewUser(
    userAttributes: UserAttributes,
    userRepository: Repository<UserDTO>
  ): Promise<UserDTO> {
    return userRepository
      .create({
        id: generateUniqueID(),
        email: userAttributes.email,
        name: userAttributes.name,
        phoneNumbers: userAttributes.phoneNumbers
      })
      .catch((error) => {
        throw new UserOperationError(`Failed to create new user. ${error}`, GENERIC_CODES.ERROR)
      })
  }

  getPostSignUpMessage(userName: string, securityCode: string): GenericMessage {
    return getEmailVerificationMessage(userName, securityCode)
  }

  getForgotPasswordMessage(userName: string, securityCode: string): GenericMessage {
    return getPasswordResetVerificationMessage(userName, securityCode)
  }

  getAppUserWelcomeMail(userName: string): GenericMessage {
    return getAppUserWelcomeMailMessage(userName)
  }

  async getUser(userId: string): Promise<UserDetailsDTO> {
    const userProfile = await this.userRepository.getItem(`USER#${userId}`, 'PROFILE')
    if (userProfile === null) {
      throw new Error('User not found')
    }

    return userProfile
  }

  async createUser(
    userAttributes: CreateUserAttributes,
    locationService: LocationService,
    minMonthsBetweenDonations: number
  ): Promise<void> {
    const { userId, preferredDonationLocations } = userAttributes
    const updateData: Partial<UserDetailsDTO> = await this.updateUserProfile(
      userId,
      userAttributes,
      minMonthsBetweenDonations
    )

    this.logger.info('updating user locations')
    if (preferredDonationLocations !== undefined) {
      await locationService
        .updateUserLocation(userId, preferredDonationLocations, updateData)
        .catch((error) => {
          throw new UserOperationError(
            `Failed to update user location. Error: ${error}`,
            GENERIC_CODES.ERROR
          )
        })
    }
  }

  async updateUser(
    userAttributes: CreateUserAttributes | UpdateUserAttributes,
    locationService: LocationService,
    minMonthsBetweenDonations: number
  ): Promise<void> {
    const { userId, preferredDonationLocations } = userAttributes
    const userProfile = await this.getUser(userId)
    const updateData: Partial<UserDetailsDTO> = await this.updateUserProfile(
      userId,
      {
        ...userAttributes,
        countryCode: userProfile.countryCode
      },
      minMonthsBetweenDonations
    )

    this.logger.info('updating user locations')
    if (preferredDonationLocations !== undefined) {
      await locationService
        .updateUserLocation(userId, preferredDonationLocations, updateData)
        .catch((error) => {
          throw new UserOperationError(
            `Failed to update user location. Error: ${error}`,
            GENERIC_CODES.ERROR
          )
        })
    }
  }

  async updateUserProfile(
    userId: string,
    userAttributes: CreateUserAttributes | UpdateUserAttributes,
    minMonthsBetweenDonations: number
  ): Promise<Partial<UserDetailsDTO>> {
    const updateData: Partial<UserDetailsDTO> = {
      ...userAttributes,
      id: userId,
      updatedAt: new Date().toISOString()
    }

    this.logger.info('validating user attributes')
    if (userAttributes.dateOfBirth !== undefined) {
      updateData.age = this.calculateAge(userAttributes.dateOfBirth)
    }
    if (userAttributes.availableForDonation !== undefined) {
      updateData.availableForDonation = this.checkLastDonationDate(
        userAttributes.lastDonationDate,
        userAttributes.availableForDonation,
        minMonthsBetweenDonations
      )
    }
    this.logger.info('updating user profile')
    await this.userRepository.update(updateData).catch((error) => {
      throw new UserOperationError(`Failed to update user. Error: ${error}`, GENERIC_CODES.ERROR)
    })

    return updateData
  }

  async updateUserAttributes(
    userId: string,
    userAttributes: Partial<CreateUserAttributes | UpdateUserAttributes>,
    locationService: LocationService,
    minMonthsBetweenDonations: number
  ): Promise<void> {
    const userProfile: UserDetailsDTO = await this.getUser(userId)
    const { preferredDonationLocations } = userAttributes
    const userLocations: LocationDTO[]
      = preferredDonationLocations === undefined
        ? await locationService.queryUserLocations(userId)
        : preferredDonationLocations

    const updatedUserAttributes: UpdateUserAttributes = {
      ...userProfile,
      ...userAttributes,
      preferredDonationLocations: userLocations,
      userId
    }
    await this.updateUser(updatedUserAttributes, locationService, minMonthsBetweenDonations)
  }

  private checkLastDonationDate(
    lastDonationDate: string | undefined,
    availableForDonation: boolean,
    minMonthsBetweenDonations: number
  ): boolean {
    if (availableForDonation && lastDonationDate !== undefined && lastDonationDate !== '') {
      const donationDate = new Date(lastDonationDate)
      const currentDate = new Date()

      if (!isNaN(donationDate.getTime())) {
        const donationMonths = differenceInMonths(currentDate, donationDate)

        return donationMonths > minMonthsBetweenDonations
      }
    }

    return availableForDonation
  }

  private calculateAge(dateOfBirth: string): number | undefined {
    if (dateOfBirth !== '') {
      const birthDate = new Date(dateOfBirth)
      const currentDate = new Date()

      if (!isNaN(birthDate.getTime())) {
        return differenceInYears(currentDate, birthDate)
      }
    }
  }

  async updateUserNotificationEndPoint(userId: string, snsEndpointArn: string): Promise<void> {
    const updateData: Partial<StoreNotificationEndPoint> = {
      id: userId,
      snsEndpointArn,
      updatedAt: new Date().toISOString()
    }
    await this.userRepository.update(updateData)
  }

  async getDeviceSnsEndpointArn(userId: string): Promise<string> {
    try {
      const userProfile = await this.userRepository.getUser(userId)
      if (userProfile?.snsEndpointArn === null) {
        throw new Error('User has no registered device for notifications')
      }

      return userProfile.snsEndpointArn
    } catch (error) {
      throw new UserOperationError(`Failed to update user. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }


  async recordLastSuccessfulLoginTimestamp(userId: string, timestamp: string): Promise<void> {
    this.logger.info('Recording last successful login', { userId, timestamp })
    try {
      await this.userRepository.update({
        id: userId,
        lastLogin: timestamp,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      this.logger.error('Failed to record last successful login', { userId, error })
    }
  }
}

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
import type LocationRepository from '../models/policies/repositories/LocationRepository'
import type { Logger } from '../models/logger/Logger'
import type UserRepository from '../models/policies/repositories/UserRepository'
import type { LocationService } from './LocationService'

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

  async getUser(
    userId: string,
    userRepository: Repository<UserDetailsDTO>
  ): Promise<UserDetailsDTO> {
    const userProfile = await userRepository.getItem(`USER#${userId}`, 'PROFILE')
    if (userProfile === null) {
      throw new Error('User not found')
    }
    return userProfile
  }

  async updateUser(
    userAttributes: CreateUserAttributes | UpdateUserAttributes,
    locationService: LocationService,
    minMonthsBetweenDonations: number
  ): Promise<void> {
    const { userId, preferredDonationLocations, ...restAttributes } = userAttributes
    const updateData: Partial<UserDetailsDTO> = {
      ...restAttributes,
      id: userId,
      updatedAt: new Date().toISOString()
    }

    this.logger.info('validating user attributes')
    updateData.age = this.calculateAge(userAttributes.dateOfBirth)
    updateData.availableForDonation = this.checkLastDonationDate(
      userAttributes.lastDonationDate,
      userAttributes.availableForDonation,
      minMonthsBetweenDonations
    )

    this.logger.info('updating user profile')
    await this.userRepository.update(updateData).catch((error) => {
      throw new UserOperationError(`Failed to update user. Error: ${error}`, GENERIC_CODES.ERROR)
    })

    this.logger.info('updating user locations')
    await locationService.updateUserLocation(
      userId,
      preferredDonationLocations,
      updateData
    ).catch((error) => {
      throw new UserOperationError(
        `Failed to update user location. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    })
  }

  async UpdateUserAttributes(
    userId: string,
    userAttributes: UpdateUserAttributes,
    userRepository: Repository<UserDetailsDTO>,
    locationRepository: LocationRepository<LocationDTO>
  ): Promise<void> {
    const userProfile: UserDetailsDTO = await this.getUser(userId, userRepository)
    const userLocations: LocationDTO[] = await locationRepository.queryUserLocations(userId)
    const updatedUserAttributes: UpdateUserAttributes = {
      ...userProfile,
      ...userAttributes,
      preferredDonationLocations: userLocations,
      userId
    }
    await this.updateUser(updatedUserAttributes, userRepository, locationRepository)
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

  async getDeviceSnsEndpointArn(
    userId: string,
    userRepository: Repository<UserDetailsDTO>
  ): Promise<string> {
    try {
      const userProfile = await userRepository.getItem(`USER#${userId}`, 'PROFILE')
      if (userProfile?.snsEndpointArn == null) {
        throw new Error('User has no registered device for notifications')
      }

      return userProfile.snsEndpointArn
    } catch (error) {
      throw new UserOperationError(`Failed to update user. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }
}

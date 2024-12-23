import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import UserOperationError from './UserOperationError'
import {
  AvailableForDonation,
  LocationDTO,
  UserDetailsDTO,
  UserDTO
} from '../../../commons/dto/UserDTO'
import { generateUniqueID } from '../utils/idGenerator'
import { GenericMessage } from '../../../commons/dto/MessageDTO'
import {
  getEmailVerificationMessage,
  getPasswordResetVerificationMessage,
  getAppUserWelcomeMailMessage
} from './userMessages'
import Repository from '../models/policies/repositories/Repository'
import { UserAttributes, UpdateUserAttributes } from './Types'
import { generateGeohash } from '../utils/geohash'
import { differenceInYears, differenceInMonths } from 'date-fns'
import { BloodGroup } from '../../../commons/dto/DonationDTO'
import LocationRepository from '../models/policies/repositories/LocationRepository'

export class UserService {
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
        throw new UserOperationError(
          `Failed to create new user. Error: ${error}`,
          GENERIC_CODES.ERROR
        )
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
    if (userProfile == null) {
      throw new Error('User not found')
    }
    return userProfile
  }

  async updateUser(
    userAttributes: UpdateUserAttributes,
    userRepository: Repository<UserDetailsDTO>,
    locationRepository: LocationRepository<LocationDTO>
  ): Promise<void> {
    const { userId, preferredDonationLocations, ...restAttributes } = userAttributes
    const updateData: Partial<UserDetailsDTO> = {
      ...restAttributes,
      id: userId,
      updatedAt: new Date().toISOString()
    }

    updateData.age = this.calculateAge(userAttributes.dateOfBirth)
    updateData.availableForDonation = this.checkLastDonationDate(
      userAttributes.lastDonationDate,
      userAttributes.availableForDonation
    )

    await userRepository.update(updateData).catch((error) => {
      throw new UserOperationError(`Failed to update user. Error: ${error}`, GENERIC_CODES.ERROR)
    })

    await this.updateUserLocation(
      userId,
      preferredDonationLocations,
      updateData,
      locationRepository
    ).catch((error) => {
      throw new UserOperationError(
        `Failed to update user location. Error: ${error}`,
        GENERIC_CODES.ERROR
      )
    })
  }

  private checkLastDonationDate(
    lastDonationDate: string | undefined,
    availableForDonation: AvailableForDonation
  ): AvailableForDonation {
    if (lastDonationDate !== undefined && lastDonationDate !== '') {
      const donationDate = new Date(lastDonationDate)
      const currentDate = new Date()

      if (!isNaN(donationDate.getTime())) {
        const donationMonths = differenceInMonths(currentDate, donationDate)
        return donationMonths > Number(process.env.MIN_MONTHS_BETWEEN_DONATIONS)
          ? availableForDonation
          : 'no'
      }
    }
    return availableForDonation
  }

  private calculateAge(dateOfBirth: string): number | undefined {
    if (dateOfBirth !== '') {
      const birthDate = new Date(dateOfBirth)
      const currentDate = new Date()

      if (!isNaN(birthDate.getTime())) {
        const age = differenceInYears(currentDate, birthDate)
        return age
      }
    }
  }

  private async updateUserLocation(
    userId: string,
    preferredDonationLocations: LocationDTO[],
    userAttributes: Partial<UserDetailsDTO>,
    locationRepository: LocationRepository<LocationDTO, Record<string, unknown>>
  ): Promise<void> {
    if (preferredDonationLocations.length === 0 && userAttributes.city !== undefined) {
      await locationRepository.deleteUserLocations(userId)

      for (const location of preferredDonationLocations) {
        const locationData: LocationDTO = {
          userId: `${userId}`,
          locationId: generateUniqueID(),
          area: location.area,
          city: `${userAttributes.city}`,
          latitude: location.latitude,
          longitude: location.longitude,
          geohash: generateGeohash(location.latitude, location.longitude),
          bloodGroup: userAttributes.bloodGroup as BloodGroup,
          availableForDonation: userAttributes.availableForDonation as AvailableForDonation,
          lastVaccinatedDate: `${userAttributes.lastVaccinatedDate}`,
          createdAt: new Date().toISOString()
        }
        await locationRepository.create(locationData)
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

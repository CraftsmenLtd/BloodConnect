import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import UserOperationError from './UserOperationError'
import { LocationDTO, UserDetailsDTO, UserDTO } from '../../../commons/dto/UserDTO'
import { generateUniqueID } from '../utils/idGenerator'
import { GenericMessage } from '../../../commons/dto/MessageDTO'
import { getEmailVerificationMessage, getPasswordResetVerificationMessage } from './userMessages'
import Repository from '../technicalImpl/policies/repositories/Repository'
import { UserAttributes, UpdateUserAttributes } from './Types'
import { generateGeohash } from '../../application/utils/geohash'
import { QueryConditionOperator, QueryInput } from '../../application/technicalImpl/policies/repositories/QueryTypes'
import LocationModel, { LocationFields } from '../../application/technicalImpl/dbModels/LocationModel'

export class UserService {
  async createNewUser(userAttributes: UserAttributes, userRepository: Repository<UserDTO>): Promise<UserDTO> {
    try {
      return userRepository.create({
        id: generateUniqueID(),
        email: userAttributes.email,
        name: userAttributes.name,
        phone: userAttributes.phone_number
      })
    } catch (error) {
      throw new UserOperationError(`Failed to create new user. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  getPostSignUpMessage(userName: string, securityCode: string): GenericMessage {
    return getEmailVerificationMessage(userName, securityCode)
  }

  getForgotPasswordMessage(userName: string, securityCode: string): GenericMessage {
    return getPasswordResetVerificationMessage(userName, securityCode)
  }

  async UpdateUser(userAttributes: UpdateUserAttributes, userRepository: Repository<UserDetailsDTO>, locationRepository: Repository<LocationDTO>, model: LocationModel): Promise<string> {
    try {
      const { userId, preferredDonationLocations, ...restAttributes } = userAttributes
      const updateData: Partial<UserDetailsDTO> = {
        ...restAttributes,
        id: userId,
        updatedAt: new Date().toISOString()
      }

      await userRepository.update(updateData)
      await this.UpdateUserLocation(model, userId, locationRepository, preferredDonationLocations, userAttributes)
      return 'Updated your Profile info'
    } catch (error) {
      throw new UserOperationError(`Failed to update user. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  private async UpdateUserLocation(model: LocationModel, userId: string, locationRepository: Repository<LocationDTO, Record<string, unknown>>, preferredDonationLocations: LocationDTO[], userAttributes: UpdateUserAttributes): Promise<void> {
    const primaryIndex = model.getPrimaryIndex()
    const query: QueryInput<LocationFields> = {
      partitionKeyCondition: {
        attributeName: primaryIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `USER#${userId}`
      }
    }

    if (primaryIndex.sortKey != null) {
      query.sortKeyCondition = {
        attributeName: primaryIndex.sortKey,
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: 'LOCATION#'
      }
    }

    const existingLocations = await locationRepository.query(query as QueryInput<Record<string, unknown>>)
    for (const location of existingLocations.items) {
      await locationRepository.delete(`USER#${userId}`, `LOCATION#${location.locationId}`)
    }

    if (preferredDonationLocations != null) {
      for (const location of preferredDonationLocations) {
        const locationData: LocationDTO = {
          userId: `${userId}`,
          locationId: generateUniqueID(),
          area: location.area,
          city: location.city,
          latitude: location.latitude,
          longitude: location.longitude,
          geohash: generateGeohash(location.latitude, location.longitude),
          bloodGroup: userAttributes.bloodGroup,
          availableForDonation: userAttributes.availableForDonation,
          lastVaccinatedDate: userAttributes.lastVaccinatedDate,
          createdAt: new Date().toISOString()
        }
        await locationRepository.create(locationData)
      }
    }
  }
}

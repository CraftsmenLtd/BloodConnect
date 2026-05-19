import type { LocationDTO, UserDetailsDTO } from '../../../commons/dto/UserDTO'
import { generateUniqueID } from '../utils/idGenerator'
import { generateH3Cell } from '../utils/h3'
import {
  H3_DONOR_SEARCH_RESOLUTION,
  H3_FINE_RESOLUTION
} from '../../../commons/libs/constants/NoMagicNumbers'
import type { BloodGroup } from '../../../commons/dto/DonationDTO'
import type LocationRepository from '../models/policies/repositories/LocationRepository'
import type { Logger } from '../models/logger/Logger'

export class LocationService {
  constructor(
    protected readonly locationRepository: LocationRepository,
    protected readonly logger: Logger
  ) { }

  async updateUserLocation(
    userId: string,
    preferredDonationLocations: LocationDTO[],
    userAttributes: Partial<UserDetailsDTO>,
  ): Promise<void> {
    if (
      preferredDonationLocations !== undefined
      && preferredDonationLocations.length !== 0
    ) {
      await this.locationRepository.deleteUserLocations(userId)

      for (const location of preferredDonationLocations) {
        const locationData: LocationDTO = {
          userId,
          locationId: generateUniqueID(),
          area: location.area,
          countryCode: userAttributes.countryCode as string,
          latitude: location.latitude,
          longitude: location.longitude,
          h3Res8: generateH3Cell(location.latitude, location.longitude, H3_DONOR_SEARCH_RESOLUTION),
          h3Res10: generateH3Cell(location.latitude, location.longitude, H3_FINE_RESOLUTION),
          bloodGroup: userAttributes.bloodGroup as BloodGroup,
          availableForDonation: userAttributes.availableForDonation === true,
          lastVaccinatedDate: `${userAttributes.lastVaccinatedDate}`,
          createdAt: new Date().toISOString()
        }
        await this.locationRepository.create(locationData)
      }
    }
  }

  async queryUserLocations(
    userId: string,
  ): Promise<LocationDTO[]> {
    return this.locationRepository.queryUserLocations(userId)
  }
}

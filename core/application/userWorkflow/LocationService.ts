import type { LocationDTO, UserDetailsDTO } from '../../../commons/dto/UserDTO'
import { generateUniqueID } from '../utils/idGenerator'
import { generateGeohash } from '../utils/geohash'
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
      preferredDonationLocations !== undefined &&
      preferredDonationLocations.length !== 0
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
          geohash: generateGeohash(location.latitude, location.longitude),
          bloodGroup: userAttributes.bloodGroup as BloodGroup,
          availableForDonation: userAttributes.availableForDonation === true,
          lastVaccinatedDate: `${userAttributes.lastVaccinatedDate}`,
          createdAt: new Date().toISOString()
        }
        await this.locationRepository.create(locationData)
      }
    }
  }
}

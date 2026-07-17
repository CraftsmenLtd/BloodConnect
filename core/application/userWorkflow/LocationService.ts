import type { LocationDTO, UserDetailsDTO } from '../../../commons/dto/UserDTO'
import { generateUniqueID } from '../utils/idGenerator'
import { generateH3Cell } from '../utils/h3'
import {
  H3_DONOR_SEARCH_RESOLUTION,
  H3_FINE_RESOLUTION
} from '../../../commons/libs/constants/NoMagicNumbers'
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
      preferredDonationLocations === undefined
      || preferredDonationLocations.length === 0
    ) {
      return
    }

    const { countryCode, bloodGroup, availableForDonation } = userAttributes
    // countryCode, bloodGroup and availableForDonation are encoded into the
    // donor-search index key (GSI1PK). Writing fabricated stand-ins for them
    // ("undefined", forced UNAVAIL) silently removes the donor from search,
    // so refuse to write locations without them.
    if (countryCode === undefined || countryCode === '') {
      throw new Error('Cannot update locations: user countryCode is missing')
    }
    if (bloodGroup === undefined || bloodGroup.length === 0) {
      throw new Error('Cannot update locations: user bloodGroup is missing')
    }
    if (typeof availableForDonation !== 'boolean') {
      throw new Error('Cannot update locations: user availableForDonation is missing')
    }

    const existingLocations = await this.locationRepository.queryUserLocations(userId)

    for (const location of preferredDonationLocations) {
      const locationData: LocationDTO = {
        userId,
        locationId: generateUniqueID(),
        area: location.area,
        countryCode,
        latitude: location.latitude,
        longitude: location.longitude,
        h3Res8: generateH3Cell(location.latitude, location.longitude, H3_DONOR_SEARCH_RESOLUTION),
        h3Res10: generateH3Cell(location.latitude, location.longitude, H3_FINE_RESOLUTION),
        bloodGroup,
        availableForDonation,
        ...(userAttributes.lastVaccinatedDate !== undefined && {
          lastVaccinatedDate: userAttributes.lastVaccinatedDate
        }),
        createdAt: new Date().toISOString()
      }
      await this.locationRepository.create(locationData)
    }

    // Delete the old rows only after the new ones are written, so a failure
    // above leaves the donor searchable instead of location-less.
    for (const oldLocation of existingLocations) {
      await this.locationRepository.deleteUserLocation(userId, oldLocation.locationId)
    }
  }

  async queryUserLocations(
    userId: string,
  ): Promise<LocationDTO[]> {
    return this.locationRepository.queryUserLocations(userId)
  }
}

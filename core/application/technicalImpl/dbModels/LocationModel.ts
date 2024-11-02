import { BloodGroup } from '../../../../commons/dto/DonationDTO'
import { LocationDTO, availableForDonation } from '../../../../commons/dto/UserDTO'
import { DbIndex, DbModelDtoAdapter, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'

export type LocationFields = Omit<LocationDTO, 'userId' | 'locationId' | 'city' | 'bloodGroup' | 'availableForDonation' | 'geohash'> & {
  PK: `USER#${string}`;
  SK: `LOCATION#${string}`;
  GSI1PK: `CITY#${string}#BG#${string}#DONATIONSTATUS${string}`;
  GSI1SK: `${string}`;
}

export default class LocationModel implements NosqlModel<LocationFields>, DbModelDtoAdapter<LocationDTO, LocationFields> {
  getIndexDefinitions(): IndexDefinitions<LocationFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<LocationFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<LocationFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(locationDto: LocationDTO): LocationFields {
    const { userId, locationId, city, bloodGroup, availableForDonation, geohash, ...remainingFields } = locationDto

    return {
      PK: `USER#${userId}`,
      SK: `LOCATION#${locationId}`,
      GSI1PK: `CITY#${city}#BG#${bloodGroup}#DONATIONSTATUS#${availableForDonation}`,
      GSI1SK: `${geohash}`,
      ...remainingFields,
      createdAt: new Date().toISOString()
    }
  }

  toDto(dbFields: LocationFields): LocationDTO {
    const { PK, SK, GSI1PK, GSI1SK, ...remainingFields } = dbFields
    const userId = PK.replace('USER#', '')
    const locationId = SK.replace('LOCATION#', '')

    const gsiMatch = GSI1PK.match(/^CITY#(.+)#BG#(.+)#DONATIONSTATUS#(.+)$/)
    if (gsiMatch !== null) {
      const [, city, bloodGroupStr, donationStatus] = gsiMatch
      const bloodGroup: BloodGroup = bloodGroupStr as BloodGroup
      const availableForDonation: availableForDonation = donationStatus === 'yes' ? 'yes' : 'no'

      return {
        userId,
        locationId,
        city,
        bloodGroup,
        availableForDonation,
        geohash: GSI1SK ?? '',
        ...remainingFields
      }
    } else {
      throw new Error('GSI1PK format is invalid.')
    }
  }
}

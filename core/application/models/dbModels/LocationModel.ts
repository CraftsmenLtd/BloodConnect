import { BloodGroup } from '../../../../commons/dto/DonationDTO'
import { LocationDTO } from '../../../../commons/dto/UserDTO'
import {
  DbIndex,
  DbModelDtoAdapter,
  IndexDefinitions,
  IndexType,
  NosqlModel
} from './DbModelDefinitions'

export type LocationFields = Omit<
LocationDTO,
| 'userId'
| 'locationId'
| 'countryCode'
| 'bloodGroup'
| 'availableForDonation'
| 'geohash'
> & {
  PK: `USER#${string}`;
  SK: `LOCATION#${string}`;
  GSI1PK: `LOCATION#${string}-${string}#BG#${string}#DONATIONSTATUS#${string}`;
  GSI1SK: `${string}`;
}

export default class LocationModel
implements NosqlModel<LocationFields>, DbModelDtoAdapter<LocationDTO, LocationFields> {
  getIndexDefinitions(): IndexDefinitions<LocationFields> {
    return {
      GSI: {
        GSI1: {
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        }
      }
    }
  }

  getPrimaryIndex(): DbIndex<LocationFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<LocationFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(locationDto: LocationDTO): LocationFields {
    const {
      userId,
      locationId,
      countryCode,
      bloodGroup,
      availableForDonation,
      geohash,
      ...remainingFields
    } = locationDto

    const geoPartition = geohash.slice(0, 4)
    return {
      PK: `USER#${userId}`,
      SK: `LOCATION#${locationId}`,
      GSI1PK: `LOCATION#${countryCode}-${geoPartition}#BG#${bloodGroup}#DONATIONSTATUS#${availableForDonation}`,
      GSI1SK: `${geohash}`,
      ...remainingFields,
      createdAt: new Date().toISOString()
    }
  }

  toDto(dbFields: LocationFields): LocationDTO {
    const { PK, SK, GSI1PK, GSI1SK, ...remainingFields } = dbFields
    const userId = PK.replace('USER#', '')
    const locationId = SK.replace('LOCATION#', '')

    const gsiMatch = GSI1PK.match(/^LOCATION#(.+)-(.+)#BG#(.+)#DONATIONSTATUS#(.+)$/)
    if (gsiMatch === null) {
      throw new Error('GSI1PK format is invalid.')
    }

    const [, countryCode, , bloodGroupStr, donationStatus] = gsiMatch
    const bloodGroup: BloodGroup = bloodGroupStr as BloodGroup
    const availableForDonation: boolean = donationStatus === 'true'

    return {
      userId,
      locationId,
      countryCode,
      bloodGroup,
      availableForDonation,
      geohash: GSI1SK ?? '',
      ...remainingFields
    }
  }
}

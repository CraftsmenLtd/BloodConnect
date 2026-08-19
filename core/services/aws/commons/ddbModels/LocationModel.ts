import type { BloodGroup } from '../../../../../commons/dto/DonationDTO'
import type { LocationDTO } from '../../../../../commons/dto/UserDTO'
import type {
  DbIndex,
  DbModelDtoAdapter,
  IndexDefinitions,
  IndexType,
  NosqlModel
} from './DbModelDefinitions'

type DonationStatus = 'AVAIL' | 'UNAVAIL'

export type LocationFields = Omit<
LocationDTO,
| 'userId'
| 'locationId'
| 'countryCode'
| 'bloodGroup'
| 'availableForDonation'
> & {
  PK: `USER#${string}`;
  SK: `LOCATION#${string}`;
  GSI1PK: `LOC#${string}#${string}#${DonationStatus}#${string}`;
  GSI1SK: `USER#${string}`;
}

function donationStatusKey(availableForDonation: boolean): DonationStatus {
  return availableForDonation ? 'AVAIL' : 'UNAVAIL'
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
      h3Res8,
      ...remainingFields
    } = locationDto

    const status = donationStatusKey(availableForDonation)

    return {
      PK: `USER#${userId}`,
      SK: `LOCATION#${locationId}`,
      GSI1PK: `LOC#${countryCode}#${bloodGroup}#${status}#${h3Res8}`,
      GSI1SK: `USER#${userId}`,
      h3Res8,
      ...remainingFields,
      createdAt: remainingFields.createdAt ?? new Date().toISOString()
    }
  }

  toDto(dbFields: LocationFields): LocationDTO {
    const { PK, SK, GSI1PK, GSI1SK: _GSI1SK, ...remainingFields } = dbFields
    const userId = PK.replace('USER#', '')
    const locationId = SK.replace('LOCATION#', '')

    const gsiMatch = GSI1PK.match(/^LOC#(.+)#(.+)#(AVAIL|UNAVAIL)#(.+)$/)
    if (gsiMatch === null) {
      throw new Error('GSI1PK format is invalid.')
    }

    const [, countryCode, bloodGroupStr, statusKey] = gsiMatch
    const bloodGroup: BloodGroup = bloodGroupStr as BloodGroup
    const availableForDonation = statusKey === 'AVAIL'

    return {
      userId,
      locationId,
      countryCode,
      bloodGroup,
      availableForDonation,
      ...remainingFields
    }
  }
}

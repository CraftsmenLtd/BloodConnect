import { AcceptedDonationDTO } from '../../../../commons/dto/DonationDTO'
import { DbModelDtoAdapter, HasTimeLog, NosqlModel, DbIndex, IndexDefinitions, IndexType } from './DbModelDefinitions'

export const ACCEPTED_DONATION_PK_PREFIX = 'BLOOD_REQ'
export const ACCEPTED_DONATION_SK_PREFIX = 'ACCEPTED'

export type AcceptedDonationFields = Omit<AcceptedDonationDTO, 'id' | 'seekerId'> & HasTimeLog & {
  PK: `${typeof ACCEPTED_DONATION_PK_PREFIX}#${string}`;
  SK: `${typeof ACCEPTED_DONATION_SK_PREFIX}#${string}#${string}`;
}

export class AcceptDonationRequestModel implements NosqlModel<AcceptedDonationFields>, DbModelDtoAdapter<AcceptedDonationDTO, AcceptedDonationFields> {
  getIndexDefinitions(): IndexDefinitions<AcceptedDonationFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<AcceptedDonationFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<AcceptedDonationFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(acceptedDonationDto: AcceptedDonationDTO): AcceptedDonationFields {
    return {
      PK: `${ACCEPTED_DONATION_PK_PREFIX}#${acceptedDonationDto.seekerId}`,
      SK: `${ACCEPTED_DONATION_SK_PREFIX}#${acceptedDonationDto.requestPostId}#${acceptedDonationDto.donorId}`,
      ...acceptedDonationDto
    }
  }

  toDto(dbFields: AcceptedDonationFields): AcceptedDonationDTO {
    const { PK, SK, ...remainingFields } = dbFields
    return {
      ...remainingFields,
      seekerId: PK.replace(`${ACCEPTED_DONATION_PK_PREFIX}#`, ''),
      donorId: SK.split('#')[2],
      requestPostId: SK.split('#')[1]
    }
  }
}

import { AcceptedDonationDTO } from '../../../../commons/dto/DonationDTO'
import {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  DbIndex,
  IndexDefinitions,
  IndexType
} from './DbModelDefinitions'

export const ACCEPTED_DONATION_PK_PREFIX = 'BLOOD_REQ'
export const ACCEPTED_DONATION_SK_PREFIX = 'ACCEPTED'
export const ACCEPTED_DONATION_GSI1PK_PREFIX = 'DONOR'
export const ACCEPTED_DONATION_GSI1SK_PREFIX = 'STATUS'

export type AcceptedDonationFields = Omit<AcceptedDonationDTO, 'id' | 'seekerId'> & HasTimeLog & {
  PK: `${typeof ACCEPTED_DONATION_PK_PREFIX}#${string}`;
  SK: `${typeof ACCEPTED_DONATION_SK_PREFIX}#${string}#${string}`;
  GSI1PK?: `${typeof ACCEPTED_DONATION_GSI1PK_PREFIX}#${string}`;
  GSI1SK?: `${typeof ACCEPTED_DONATION_GSI1SK_PREFIX}#${string}`;
}

export class AcceptDonationRequestModel
implements
    NosqlModel<AcceptedDonationFields>,
    DbModelDtoAdapter<AcceptedDonationDTO, AcceptedDonationFields> {
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
    const data: AcceptedDonationFields = {
      PK: `${ACCEPTED_DONATION_PK_PREFIX}#${acceptedDonationDto.seekerId}`,
      SK: `${ACCEPTED_DONATION_SK_PREFIX}#${acceptedDonationDto.requestPostId}#${acceptedDonationDto.donorId}`,
      ...acceptedDonationDto
    }

    if (acceptedDonationDto.donorId !== undefined) {
      data.GSI1PK = `${ACCEPTED_DONATION_GSI1PK_PREFIX}#${acceptedDonationDto.donorId}`
    }
    if (acceptedDonationDto.status !== undefined) {
      data.GSI1SK = `${ACCEPTED_DONATION_GSI1SK_PREFIX}#${acceptedDonationDto.status}`
    }
    return data
  }

  toDto(dbFields: AcceptedDonationFields): AcceptedDonationDTO {
    const { PK, SK, GSI1PK, GSI1SK, ...remainingFields } = dbFields
    return {
      ...remainingFields,
      seekerId: PK.replace(`${ACCEPTED_DONATION_PK_PREFIX}#`, ''),
      requestPostId: SK.split('#')[1],
      donorId: SK.split('#')[2]
    }
  }
}

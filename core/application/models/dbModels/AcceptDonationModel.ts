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

export type AcceptedDonationFields = Omit<
AcceptedDonationDTO,
'id' | 'seekerId' | 'requestPostId' | 'donorId'
> &
HasTimeLog & {
  PK: `${typeof ACCEPTED_DONATION_PK_PREFIX}#${string}`;
  SK: `${typeof ACCEPTED_DONATION_SK_PREFIX}#${string}#${string}`;
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
    const { seekerId, requestPostId, donorId, ...remainingData } = acceptedDonationDto
    return {
      PK: `${ACCEPTED_DONATION_PK_PREFIX}#${seekerId}`,
      SK: `${ACCEPTED_DONATION_SK_PREFIX}#${requestPostId}#${donorId}`,
      ...remainingData
    }
  }

  toDto(dbFields: AcceptedDonationFields): AcceptedDonationDTO {
    const { PK, SK, ...remainingFields } = dbFields
    return {
      ...remainingFields,
      seekerId: PK.replace(`${ACCEPTED_DONATION_PK_PREFIX}#`, ''),
      requestPostId: SK.replace(`${ACCEPTED_DONATION_SK_PREFIX}#`, '').split('#')[0],
      donorId: SK.replace(`${ACCEPTED_DONATION_SK_PREFIX}#`, '').split('#')[1]
    }
  }
}

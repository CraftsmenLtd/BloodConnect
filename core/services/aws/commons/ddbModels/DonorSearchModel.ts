import type { DonorSearchDTO } from '../../../../../commons/dto/DonationDTO'
import { DonationStatus } from '../../../../../commons/dto/DonationDTO'
import type {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  IndexDefinitions,
  DbIndex,
  IndexType
} from './DbModelDefinitions'

export const DONOR_SEARCH_PK_PREFIX = 'DONOR_SEARCH'
export const DONOR_SEARCH_LSISK_PREFIX = 'STATUS'

export type DonorSearchFields = Omit<DonorSearchDTO, 'requestPostId' | 'seekerId'> &
HasTimeLog & {
  PK: `${typeof DONOR_SEARCH_PK_PREFIX}#${string}`;
  SK: `${typeof DONOR_SEARCH_PK_PREFIX}#${string}#${string}`;
  LSI1SK: `${typeof DONOR_SEARCH_LSISK_PREFIX}#${string}#${string}`;
}

export class DonorSearchModel
implements NosqlModel<DonorSearchFields>, DbModelDtoAdapter<DonorSearchDTO, DonorSearchFields> {
  getIndexDefinitions(): IndexDefinitions<DonorSearchFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<DonorSearchFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<DonorSearchFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(donationDto: DonorSearchDTO): DonorSearchFields {
    const { seekerId, requestPostId, ...remainingDonationData } = donationDto
    const postCreationDate = remainingDonationData.createdAt ?? new Date().toISOString()

    return {
      PK: `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
      SK: `${DONOR_SEARCH_PK_PREFIX}#${postCreationDate}#${requestPostId}`,
      LSI1SK: `${DONOR_SEARCH_LSISK_PREFIX}#${DonationStatus.PENDING}#${requestPostId}`,
      ...remainingDonationData,
      createdAt: postCreationDate
    }
  }

  toDto(dbFields: DonorSearchFields): DonorSearchDTO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, LSI1SK, createdAt, ...remainingDonorSearchFields } = dbFields

    return {
      ...remainingDonorSearchFields,
      requestPostId: SK.replace(`${DONOR_SEARCH_PK_PREFIX}#${createdAt}#`, ''),
      seekerId: PK.replace(`${DONOR_SEARCH_PK_PREFIX}#`, ''),
      createdAt
    }
  }
}

import { DonorSearchStatus } from '../../../../../commons/dto/DonationDTO'
import type { DonorSearchDTO } from '../../../../../commons/dto/DonationDTO'
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
  LSI1SK?: `${typeof DONOR_SEARCH_LSISK_PREFIX}#${string}#${string}`;
  GSI1PK?: `${typeof DONOR_SEARCH_PK_PREFIX}#${string}`;
  GSI1SK?: string;
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
    const postCreationDate = remainingDonationData.createdAt
    if (seekerId === undefined || seekerId === '') {
      throw new Error('Cannot build donor search key: seekerId is missing')
    }
    if (requestPostId === undefined || requestPostId === '') {
      throw new Error('Cannot build donor search key: requestPostId is missing')
    }
    if (postCreationDate === undefined || postCreationDate === '') {
      throw new Error('Cannot build donor search key: createdAt is missing')
    }

    const data: DonorSearchFields = {
      PK: `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
      SK: `${DONOR_SEARCH_PK_PREFIX}#${postCreationDate}#${requestPostId}`,
      ...remainingDonationData,
      createdAt: postCreationDate
    }

    if (remainingDonationData.status !== undefined) {
      data.LSI1SK = `${DONOR_SEARCH_LSISK_PREFIX}#${remainingDonationData.status}#${requestPostId}`
      const bucket = remainingDonationData.status === DonorSearchStatus.PENDING
        ? DonorSearchStatus.PENDING
        : remainingDonationData.completionReason ?? remainingDonationData.status
      data.GSI1PK = `${DONOR_SEARCH_PK_PREFIX}#${bucket}`
      data.GSI1SK = postCreationDate
    }

    return data
  }

  toDto(dbFields: DonorSearchFields): DonorSearchDTO {
    const {
      PK, SK, LSI1SK: _LSI1SK, GSI1PK: _GSI1PK, GSI1SK: _GSI1SK, createdAt, ...remainingDonorSearchFields
    } = dbFields

    return {
      ...remainingDonorSearchFields,
      requestPostId: SK.replace(`${DONOR_SEARCH_PK_PREFIX}#${createdAt}#`, ''),
      seekerId: PK.replace(`${DONOR_SEARCH_PK_PREFIX}#`, ''),
      createdAt
    }
  }
}

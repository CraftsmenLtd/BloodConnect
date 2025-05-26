import type { DonorSearchDTO } from 'commons/dto/DonationDTO'
import type Repository from './Repository'
import type { DonorSearchFields } from '../../../../services/aws/commons/ddbModels/DonorSearchModel'

type DonorSearchRepository = {
  getDonorSearchItem(
    seekerId: string,
    requestPostId: string,
    createdAt: string
  ): Promise<DonorSearchDTO | null>;
} & Repository<DonorSearchDTO, DonorSearchFields>
export default DonorSearchRepository

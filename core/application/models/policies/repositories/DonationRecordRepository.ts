import type { DonationRecordDTO } from 'commons/dto/DonationDTO'
import type Repository from './Repository'

type DonationRecordRepository = Repository<DonationRecordDTO, Record<string, unknown>>
export default DonationRecordRepository

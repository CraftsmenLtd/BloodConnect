import type { DonationDTO } from '../../../../../commons/dto/DonationDTO'
import type Repository from './Repository'

export type NearbyBloodRequest = {
  requestPostId: string;
  seekerId: string;
  requestedBloodGroup: string;
  bloodQuantity: number;
  urgencyLevel: string;
  latitude: number;
  longitude: number;
  location: string;
  donationDateTime: string;
  patientName?: string;
  seekerName?: string;
  contactNumber?: string;
  shortDescription?: string;
  transportationInfo?: string;
  createdAt: string;
}

type NearbyBloodRequestsRepository = {
  queryBloodRequestsInHex(
    countryCode: string,
    bloodGroup: string,
    h3Res5Cell: string,
    limit: number
  ): Promise<NearbyBloodRequest[]>;
} & Repository<DonationDTO, Record<string, unknown>>

export default NearbyBloodRequestsRepository

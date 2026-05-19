import type { DonationDTO } from '../../../../../commons/dto/DonationDTO'
import type Repository from './Repository'

export type NearbyPost = {
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

type NearbyPostsRepository = {
  queryPostsInHex(
    countryCode: string,
    bloodGroup: string,
    h3Res5Cell: string,
    limit: number
  ): Promise<NearbyPost[]>;
} & Repository<DonationDTO, Record<string, unknown>>

export default NearbyPostsRepository

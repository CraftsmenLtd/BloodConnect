import type { LocationDTO } from 'commons/dto/UserDTO'
import type Repository from './Repository'

export type DonorInHexResult = {
  userId: string;
  locationId: string;
  h3Res8: string;
  h3Res10?: string;
  latitude: number;
  longitude: number;
  displayName?: string;
  phoneE164?: string;
}

type H3SearchRepository = {
  queryDonorsInHex(
    countryCode: string,
    bloodGroup: string,
    h3Res8Cell: string,
    limit: number
  ): Promise<DonorInHexResult[]>;
} & Repository<LocationDTO, Record<string, unknown>>

export default H3SearchRepository

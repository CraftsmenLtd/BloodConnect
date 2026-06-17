import { generateH3Cell, getH3GridDisk, haversineKm } from '../utils/h3'
import {
  H3_PUBLIC_FEED_RESOLUTION,
  H3_RES_5_EDGE_KM,
  FEED_MAX_RADIUS_KM,
  FEED_DEFAULT_RADIUS_KM,
  PARALLEL_QUERY_CONCURRENCY
} from '../../../commons/libs/constants/NoMagicNumbers'
import type NearbyBloodRequestsRepository from '../models/policies/repositories/NearbyBloodRequestsRepository'
import type { NearbyBloodRequest } from '../models/policies/repositories/NearbyBloodRequestsRepository'
import type { Logger } from '../models/logger/Logger'
import type { BloodGroup } from '../../../commons/dto/DonationDTO'

const ALL_BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export type NearbyBloodRequestsResult = {
  data: (NearbyBloodRequest & { distanceKm: number })[];
  nextCursor: string | null;
}

export class NearbyBloodRequestsService {
  constructor(
    protected readonly repository: NearbyBloodRequestsRepository,
    protected readonly logger: Logger
  ) { }

  async getNearbyBloodRequests({
    lat,
    lng,
    radiusKm,
    countryCode,
    bloodGroup,
    pageSize,
    cursor
  }: {
    lat: number;
    lng: number;
    radiusKm?: number;
    countryCode: string;
    bloodGroup?: string;
    pageSize?: number;
    cursor?: string | null;
  }): Promise<NearbyBloodRequestsResult> {
    const radius = Math.min(radiusKm ?? FEED_DEFAULT_RADIUS_KM, FEED_MAX_RADIUS_KM)
    const k = Math.ceil(radius / (H3_RES_5_EDGE_KM * 1.5))
    const centerHex = generateH3Cell(lat, lng, H3_PUBLIC_FEED_RESOLUTION)
    const hexes = getH3GridDisk(centerHex, k)
    const bgGroups = bloodGroup !== undefined && bloodGroup !== ''
      ? [bloodGroup]
      : ALL_BLOOD_GROUPS

    const perHexLimit = Math.max(20, pageSize ?? 20)
    const queries = hexes.flatMap((hex) => bgGroups.map((bg) => ({ hex, bg })))

    const merged: NearbyBloodRequest[] = []
    for (let i = 0; i < queries.length; i += PARALLEL_QUERY_CONCURRENCY) {
      const batch = queries.slice(i, i + PARALLEL_QUERY_CONCURRENCY)
      const results = await Promise.all(
        batch.map((q) => this.repository.queryBloodRequestsInHex(countryCode, q.bg, q.hex, perHexLimit))
      )
      merged.push(...results.flat())
    }

    const now = Date.now()
    const seen = new Set<string>()
    const filtered = merged
      .filter((p) => {
        if (seen.has(p.requestPostId)) return false
        seen.add(p.requestPostId)

        const donationTime = new Date(p.donationDateTime).getTime()
        if (!Number.isNaN(donationTime) && donationTime < now) return false

        return haversineKm(lat, lng, p.latitude, p.longitude) <= radius
      })
      .map((p) => ({
        ...p,
        distanceKm: haversineKm(lat, lng, p.latitude, p.longitude)
      }))

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const size = pageSize ?? 20
    const offset = cursor !== null && cursor !== undefined && cursor !== ''
      ? parseInt(Buffer.from(cursor, 'base64').toString('utf-8'), 10)
      : 0
    const slice = filtered.slice(offset, offset + size)
    const nextOffset = offset + size
    const nextCursor = nextOffset < filtered.length
      ? Buffer.from(String(nextOffset), 'utf-8').toString('base64')
      : null

    return { data: slice, nextCursor }
  }
}

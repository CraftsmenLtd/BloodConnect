import { latLngToCell, gridDisk } from 'h3-js'
import type { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { queryRequests } from '../../queries/Requests'
import { toBloodRequest } from '../../data/unmarshal'
import type { BloodRequest } from '../../domain/types'
import type { DonationStatus } from '../../../../../commons/dto/DonationDTO'

// Mirrors core NearbyBloodRequestsService: latLngToCell(center,5) + gridDisk(k) fan-out over
// blood groups, then haversine-filter to the radius. Stays browser->DDB-direct and is
// parameterized by status (the HTTP API is PENDING-only).
const H3_PUBLIC_FEED_RESOLUTION = 5
const H3_RES_5_EDGE_KM = 8.54
const FEED_MAX_RADIUS_KM = 50
const PARALLEL_QUERY_CONCURRENCY = 25
const EARTH_RADIUS_KM = 6371

export const ALL_BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLng = toRadians(lng2 - lng1)
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type NearbyInput = {
  lat: number;
  lng: number;
  radiusKm: number;
  groups: string[];
  status: DonationStatus;
  country: string;
}

export const queryNearbyRequests = async(
  client: DynamoDBClient,
  { lat, lng, radiusKm, groups, status, country }: NearbyInput
): Promise<BloodRequest[]> => {
  const radius = Math.min(radiusKm, FEED_MAX_RADIUS_KM)
  const k = Math.ceil(radius / (H3_RES_5_EDGE_KM * 1.5))
  const hexes = gridDisk(latLngToCell(lat, lng, H3_PUBLIC_FEED_RESOLUTION), k)
  const tasks = hexes.flatMap((hex) => groups.map((bloodGroup) => ({ hex, bloodGroup })))

  const merged: BloodRequest[] = []
  for (let i = 0; i < tasks.length; i += PARALLEL_QUERY_CONCURRENCY) {
    const batch = tasks.slice(i, i + PARALLEL_QUERY_CONCURRENCY)
    const results = await Promise.all(batch.map((task) =>
      queryRequests(client, { h3Res5: task.hex, bloodGroup: task.bloodGroup, status, country })))
    merged.push(...results.flatMap((result) => result.items.map(toBloodRequest)))
  }

  const seen = new Set<string>()

  return merged.filter((request) => {
    if (seen.has(request.requestPostId)) return false
    seen.add(request.requestPostId)
    if (request.latitude === undefined || request.longitude === undefined) return true

    return haversineKm(lat, lng, request.latitude, request.longitude) <= radius
  })
}

import { unmarshall } from '@aws-sdk/util-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import type { BloodRequest, DonorSearch, NotifiedDonor, Wave } from '../domain/types'

type Item = Record<string, AttributeValue>

const numOrUndef = (value: unknown): number | undefined =>
  value === undefined || value === null ? undefined : Number(value)

const toWave = (wave: Record<string, unknown>): Wave => ({
  retryCount: Number(wave.retryCount ?? 0),
  level: Number(wave.level ?? 0),
  donorsFound: Number(wave.donorsFound ?? 0),
  at: String(wave.at ?? ''),
})

export const toDonorSearch = (item: Item): DonorSearch => {
  const raw = unmarshall(item) as Record<string, unknown>
  const skParts = String(raw.SK ?? '').split('#')
  const waveHistory = Array.isArray(raw.waveHistory)
    ? (raw.waveHistory as Record<string, unknown>[]).map(toWave)
    : []

  return {
    seekerId: String(raw.PK ?? '').split('#')[1] ?? '',
    createdAt: skParts[1] ?? String(raw.createdAt ?? ''),
    requestPostId: skParts[2] ?? '',
    status: String(raw.status ?? ''),
    completionReason: raw.completionReason as string | undefined,
    currentLevel: numOrUndef(raw.currentLevel),
    currentRetryCount: numOrUndef(raw.currentRetryCount),
    donorsFoundSoFar: numOrUndef(raw.donorsFoundSoFar),
    targetDonors: numOrUndef(raw.targetDonors),
    lastUpdatedAt: raw.lastUpdatedAt as string | undefined,
    waveHistory,
  }
}

export const toBloodRequest = (item: Item): BloodRequest => {
  const raw = unmarshall(item) as Record<string, unknown>
  const skParts = String(raw.SK ?? '').split('#')

  return {
    seekerId: String(raw.PK ?? '').split('#')[1] ?? '',
    createdAt: skParts[1] ?? String(raw.createdAt ?? ''),
    requestPostId: skParts[2] ?? '',
    requestedBloodGroup: String(raw.requestedBloodGroup ?? ''),
    bloodQuantity: numOrUndef(raw.bloodQuantity),
    h3Res8: String(raw.h3Res8 ?? ''),
    patientName: String(raw.patientName ?? ''),
    seekerName: String(raw.seekerName ?? ''),
    location: String(raw.location ?? ''),
    latitude: numOrUndef(raw.latitude),
    longitude: numOrUndef(raw.longitude),
    urgencyLevel: String(raw.urgencyLevel ?? ''),
    status: String(raw.status ?? ''),
    donationDateTime: String(raw.donationDateTime ?? ''),
    shortDescription: String(raw.shortDescription ?? ''),
    contactNumber: String(raw.contactNumber ?? ''),
  }
}

export const toNotifiedDonor = (notification: Item, location: Item): NotifiedDonor => {
  const note = unmarshall(notification) as Record<string, unknown>
  const loc = unmarshall(location) as Record<string, unknown>
  const payload = (note.payload ?? {}) as Record<string, unknown>

  return {
    donorId: String(note.PK ?? '').split('#')[1] ?? '',
    status: String(note.status ?? ''),
    distance: Number(payload.distance ?? 0),
    area: String(loc.area ?? ''),
    latitude: Number(loc.latitude ?? 0),
    longitude: Number(loc.longitude ?? 0),
  }
}

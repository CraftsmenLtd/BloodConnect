import { AcceptDonationStatus, DonationStatus } from '../../../commons/dto/DonationDTO'

export enum LifecycleAction {
  CREATE_CHANNEL = 'CREATE_CHANNEL',
  LOCK_REQUEST_CHANNELS = 'LOCK_REQUEST_CHANNELS',
  NOOP = 'NOOP'
}

export type ClassifyInput = {
  pk: string;
  sk: string;
  eventName: string;
  status?: string;
}

const REQUEST_PK_PREFIX = 'BLOOD_REQ#'
const ACCEPTED_SK_PREFIX = 'ACCEPTED#'
const REQUEST_SK_PREFIX = 'BLOOD_REQ#'

export const classifyStreamItem = ({ pk, sk, eventName, status }: ClassifyInput): LifecycleAction => {
  if (eventName === 'REMOVE') {
    return LifecycleAction.NOOP
  }
  if (!pk.startsWith(REQUEST_PK_PREFIX)) {
    return LifecycleAction.NOOP
  }
  if (sk.startsWith(ACCEPTED_SK_PREFIX)) {
    return status === AcceptDonationStatus.ACCEPTED
      ? LifecycleAction.CREATE_CHANNEL
      : LifecycleAction.NOOP
  }
  if (sk.startsWith(REQUEST_SK_PREFIX)) {
    return status === DonationStatus.COMPLETED
      ? LifecycleAction.LOCK_REQUEST_CHANNELS
      : LifecycleAction.NOOP
  }

  return LifecycleAction.NOOP
}

// Acceptance SK = `ACCEPTED#<requestPostId>#<donorId>`; PK = `BLOOD_REQ#<seekerId>`
export const parseAcceptanceKeys = (
  pk: string,
  sk: string
): { seekerId: string; requestPostId: string; donorId: string } => {
  const parts = sk.split('#')

  return {
    seekerId: pk.slice(REQUEST_PK_PREFIX.length),
    requestPostId: parts[1] ?? '',
    donorId: parts[2] ?? ''
  }
}

// Request SK = `BLOOD_REQ#<createdAt>#<requestPostId>`; PK = `BLOOD_REQ#<seekerId>`
export const parseRequestKeys = (
  pk: string,
  sk: string
): { seekerId: string; createdAt: string; requestPostId: string } => {
  const parts = sk.split('#')

  return {
    seekerId: pk.slice(REQUEST_PK_PREFIX.length),
    createdAt: parts[1] ?? '',
    requestPostId: parts[2] ?? ''
  }
}

import { AcceptDonationStatus } from '../../../../commons/dto/DonationDTO'

export const FIVE_MIN_IN_MS = 5 * 60 * 1000
export const REQUEST_CONTROL_CLASS = 'request-control'
export const DONOR_CONTROL_CLASS = 'donor-control'
export const HTML_DATA_BLOOD_GROUP_KEY = 'data-blood-group'
export const MARKER_POINT_COLOR_STATUS_MAP = {
  [AcceptDonationStatus.ACCEPTED]: 'orange',
  [AcceptDonationStatus.IGNORED]: 'red',
  [AcceptDonationStatus.PENDING]: 'goldenrod',
  [AcceptDonationStatus.COMPLETED]: 'green'
}

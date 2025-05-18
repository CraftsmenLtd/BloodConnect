import { AcceptDonationStatus } from '../../../../commons/dto/DonationDTO'

export const FIVE_MIN_IN_MS = 5 * 60 * 1000
export const POPUP_CONTROL_CLASS = 'popup-control-class'
export const MARKER_CONTROL_CLASS = 'marker-control-class'
export const MARKER_POINT_COLOR_STATUS_MAP = {
  [AcceptDonationStatus.ACCEPTED]: 'amber',
  [AcceptDonationStatus.IGNORED]: 'red',
  [AcceptDonationStatus.PENDING]: 'yellow',
  [AcceptDonationStatus.COMPLETED]: 'green'
}

import MapView, { MapDataPointType } from '../map/MapView'
import type { MapDataPoint } from '../map/MapView'
import type { AcceptDonationStatus, BloodGroup } from '../../../../../commons/dto/DonationDTO'
import type { BloodRequest, NotifiedDonor } from '../../domain/types'

type RequestMapProps = { request: BloodRequest; donors: NotifiedDonor[] }

const RequestMap = ({ request, donors }: RequestMapProps) => {
  if (request.latitude === undefined || request.longitude === undefined) {
    return <div className="text-muted">No location on this request.</div>
  }

  const center = { latitude: request.latitude, longitude: request.longitude }

  const requestPoint: MapDataPoint = {
    type: MapDataPointType.REQUEST,
    id: request.requestPostId,
    latitude: request.latitude,
    longitude: request.longitude,
    content: { [request.requestedBloodGroup as BloodGroup]: request.bloodQuantity ?? 1 },
    onBloodGroupCountClick: () => undefined,
  }

  const donorPoints: MapDataPoint[] = donors.map((donor) => ({
    type: MapDataPointType.DONOR,
    id: `${donor.latitude},${donor.longitude},${donor.donorId}`,
    latitude: donor.latitude,
    longitude: donor.longitude,
    distance: donor.distance,
    content: { [donor.status as AcceptDonationStatus]: 1 },
  }))

  const lines = {
    from: center,
    to: donors.map(
      (donor) => ({ latitude: donor.latitude, longitude: donor.longitude, distance: donor.distance })),
  }

  return (
    <div style={{ height: '360px' }}>
      <MapView center={center} data={[requestPoint, ...donorPoints]} lines={lines} />
    </div>
  )
}

export default RequestMap

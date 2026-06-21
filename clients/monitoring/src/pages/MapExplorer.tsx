import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container, Card, Form } from 'react-bootstrap'
import MapView, { MapDataPointType } from '../features/map/MapView'
import type { MapDataPoint } from '../features/map/MapView'
import RequestPanel from '../features/map/RequestPanel'
import { DEFAULT_CENTER_CELL, decodeCell, encodeCell, safeCell } from '../features/map/cells'
import { queryNearbyRequests, ALL_BLOOD_GROUPS } from '../features/map/nearbyRequests'
import { useDdbClient } from '../data/ddbClient'
import { DonationStatus } from '../../../../commons/dto/DonationDTO'
import type { BloodGroup } from '../../../../commons/dto/DonationDTO'
import type { BloodRequest } from '../domain/types'

const ALL_GROUPS = 'ALL'
const RADIUS_OPTIONS = [5, 10, 25, 50]
const DEFAULT_RADIUS_KM = 10

type RequestPoint = MapDataPoint & { type: MapDataPointType.REQUEST }

const MapExplorer = () => {
  const client = useDdbClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const centerHash = safeCell(searchParams.get('centerHash') ?? DEFAULT_CENTER_CELL)
  const bloodGroup = searchParams.get('bloodGroup') ?? ALL_GROUPS
  const status = (searchParams.get('status') as DonationStatus) ?? DonationStatus.PENDING
  const country = searchParams.get('country') ?? 'BD'
  const radiusKm = Number(searchParams.get('radius') ?? DEFAULT_RADIUS_KM)

  const center = useMemo(() => decodeCell(centerHash), [centerHash])
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [panelCell, setPanelCell] = useState<string | null>(null)

  useEffect(() => {
    const { latitude, longitude } = decodeCell(centerHash)
    const groups = bloodGroup === ALL_GROUPS ? ALL_BLOOD_GROUPS : [bloodGroup]
    queryNearbyRequests(client, { lat: latitude, lng: longitude, radiusKm, groups, status, country })
      .then(setRequests)
      .catch((err) => { alert(err) })
  }, [client, centerHash, bloodGroup, status, country, radiusKm])

  const setParam = (key: string, value: string) => {
    searchParams.set(key, value)
    setSearchParams(searchParams)
  }

  const data: MapDataPoint[] = useMemo(() => {
    const byCell = new Map<string, RequestPoint>()
    requests.forEach((request) => {
      if (!request.h3Res8) return
      const group = request.requestedBloodGroup as BloodGroup
      const existing = byCell.get(request.h3Res8)
      if (existing) {
        existing.content[group] = (existing.content[group] ?? 0) + 1
      } else {
        const { latitude, longitude } = decodeCell(request.h3Res8)
        byCell.set(request.h3Res8, {
          type: MapDataPointType.REQUEST,
          id: request.h3Res8,
          latitude,
          longitude,
          content: { [group]: 1 },
          onBloodGroupCountClick: (_group, cell) => setPanelCell(cell),
        })
      }
    })

    return [...byCell.values()]
  }, [requests])

  const panelRequests = requests.filter((request) => request.h3Res8 === panelCell)

  return (
    <Container fluid className="position-relative p-0" style={{ flexGrow: 1 }}>
      <div className="position-absolute top-0 start-0 m-2" style={{ zIndex: 1 }}>
        <Card data-bs-theme="dark" style={{ width: '14rem' }}>
          <Card.Body className="p-2">
            <Form.Group className="mb-2">
              <Form.Label className="small mb-1">Blood group</Form.Label>
              <Form.Select
                size="sm"
                value={bloodGroup}
                onChange={(event) => setParam('bloodGroup', event.target.value)}>
                <option value={ALL_GROUPS}>All</option>
                {ALL_BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="small mb-1">Status</Form.Label>
              <Form.Select
                size="sm"
                value={status}
                onChange={(event) => setParam('status', event.target.value)}>
                {Object.values(DonationStatus).map(
                  (option) => <option key={option} value={option}>{option}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="small mb-1">Radius</Form.Label>
              <Form.Select
                size="sm"
                value={radiusKm}
                onChange={(event) => setParam('radius', event.target.value)}>
                {RADIUS_OPTIONS.map((km) => <option key={km} value={km}>{km} km</option>)}
              </Form.Select>
            </Form.Group>
            <div className="text-muted small mt-2">Pan the map to recenter the search.</div>
          </Card.Body>
        </Card>
      </div>
      {requests.length === 0 && (
        <div
          className="position-absolute top-50 start-50 translate-middle text-light bg-dark p-3 rounded"
          style={{ zIndex: 1, opacity: 0.9 }}>
          No {bloodGroup === ALL_GROUPS ? '' : `${bloodGroup} `}{status} requests within {radiusKm} km.
          Pan the map or change filters.
        </div>
      )}
      <MapView
        center={center}
        data={data}
        onCenterChange={(arg) => setParam('centerHash', encodeCell(arg.latitude, arg.longitude))}
      />
      <RequestPanel
        show={panelCell !== null}
        requests={panelRequests}
        onClose={() => setPanelCell(null)}
      />
    </Container>
  )
}

export default MapExplorer

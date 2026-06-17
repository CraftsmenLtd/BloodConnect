import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Spinner, Row, Col, Badge } from 'react-bootstrap'
import type { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { useDdbClient } from '../data/ddbClient'
import { toBloodRequest, toDonorSearch, toNotifiedDonor } from '../data/unmarshal'
import {
  queryDonorSearch,
  queryRequestById,
  queryNotifiedDonors,
  queryUserLocation
} from '../queries/Requests'
import type { BloodRequest, DonorSearch, NotifiedDonor } from '../domain/types'
import ProgressTimeline from '../features/request/ProgressTimeline'
import WaveHistory from '../features/request/WaveHistory'
import NotifiedDonorTable from '../features/request/NotifiedDonorTable'
import RequestMap from '../features/request/RequestMap'

const loadNotifiedDonors = async(
  client: DynamoDBClient, requestPostId: string): Promise<NotifiedDonor[]> => {
  const { items } = await queryNotifiedDonors(client, { requestId: requestPostId })
  const withLocation = items.filter((note) => note.payload.M?.locationId?.S)
  const results = await Promise.all(withLocation.map(async(note) => {
    const location = await queryUserLocation(client, {
      locationId: note.payload.M.locationId.S,
      userId: note.PK.S.split('#')[1],
    })

    return location ? toNotifiedDonor(note, location) : undefined
  }))

  return results.filter((donor): donor is NotifiedDonor => donor !== undefined)
}

const RequestDetail = () => {
  const { seekerId = '', createdAt = '', requestPostId = '' } = useParams()
  const client = useDdbClient()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState<DonorSearch>()
  const [request, setRequest] = useState<BloodRequest>()
  const [donors, setDonors] = useState<NotifiedDonor[]>([])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      queryDonorSearch(client, { seekerId, requestPostId, createdAt }),
      queryRequestById(client, { seekerId, requestPostId, createdAt }),
      loadNotifiedDonors(client, requestPostId)
    ])
      .then(([searchItem, requestItem, notified]) => {
        setSearch(searchItem ? toDonorSearch(searchItem) : undefined)
        setRequest(requestItem ? toBloodRequest(requestItem) : undefined)
        setDonors(notified)
      })
      .catch((err) => { alert(err) })
      .finally(() => { setLoading(false) })
  }, [client, seekerId, createdAt, requestPostId])

  if (loading) {
    return (
      <Container className="p-4">
        <Spinner animation="border" role="status" variant="primary" />
      </Container>
    )
  }

  return (
    <Container className="p-4 text-light" style={{ flexGrow: 1, overflowY: 'auto' }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <h5 className="mb-0">Request</h5>
        <code className="text-info">{requestPostId.slice(0, 12)}</code>
        {request && <Badge bg="dark">{request.requestedBloodGroup}</Badge>}
        {request && <span className="text-muted">{request.location}</span>}
      </div>
      {request && (
        <div className="mb-3 small text-muted">
          {request.patientName} · {request.urgencyLevel} · {request.bloodQuantity ?? '?'} bags
          {' · seeker '}{request.seekerName}
        </div>
      )}
      <Row>
        <Col lg={6}>
          <h6>Search progress</h6>
          {search
            ? <><ProgressTimeline search={search} /><WaveHistory waves={search.waveHistory} /></>
            : <div className="text-muted">No donor-search record found.</div>}
          <h6>Notified donors <span className="text-muted">({donors.length})</span></h6>
          <NotifiedDonorTable donors={donors} />
        </Col>
        <Col lg={6}>
          <h6>Map</h6>
          {request
            ? <RequestMap request={request} donors={donors} />
            : <div className="text-muted">No request record to map.</div>}
        </Col>
      </Row>
    </Container>
  )
}

export default RequestDetail

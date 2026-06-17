import { Offcanvas, ListGroup } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { timeAgo } from '../../data/format'
import type { BloodRequest } from '../../domain/types'

type RequestPanelProps = {
  show: boolean;
  requests: BloodRequest[];
  onClose: () => void;
}

const RequestPanel = ({ show, requests, onClose }: RequestPanelProps) => {
  const navigate = useNavigate()
  const open = (request: BloodRequest) => navigate(
    `/request/${encodeURIComponent(request.seekerId)}`
    + `/${encodeURIComponent(request.createdAt)}`
    + `/${encodeURIComponent(request.requestPostId)}`)

  return (
    <Offcanvas
      show={show}
      placement="end"
      backdrop={false}
      className="bg-dark text-light"
      onHide={onClose}>
      <Offcanvas.Header closeButton closeVariant="white">
        <Offcanvas.Title>{requests.length} requests</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <ListGroup>
          {requests.map((request) => (
            <ListGroup.Item
              key={`${request.seekerId}#${request.createdAt}#${request.requestPostId}`}
              action
              onClick={() => open(request)}
              className="bg-dark text-light border-secondary">
              <div className="d-flex gap-2 align-items-center">
                <code className="text-info">{request.requestPostId.slice(0, 8)}</code>
                <span>{request.requestedBloodGroup}</span>
                <span className="text-muted">{request.patientName}</span>
                <span className="ms-auto text-muted small">{timeAgo(request.createdAt)}</span>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Offcanvas.Body>
    </Offcanvas>
  )
}

export default RequestPanel

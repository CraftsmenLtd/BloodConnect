import { useNavigate } from 'react-router-dom'
import { Badge, ListGroup } from 'react-bootstrap'
import { timeAgo } from '../../data/format'
import type { DonorSearch } from '../../domain/types'

export type Health = 'ok' | 'slow' | 'stuck'

const healthColor: Record<Health, string> = {
  ok: 'success',
  slow: 'warning',
  stuck: 'danger',
}

const FeedRow = ({ search, health }: { search: DonorSearch; health: Health }) => {
  const navigate = useNavigate()
  const found = search.donorsFoundSoFar ?? 0

  const open = () => navigate(
    `/request/${encodeURIComponent(search.seekerId)}`
    + `/${encodeURIComponent(search.createdAt)}`
    + `/${encodeURIComponent(search.requestPostId)}`)

  return (
    <ListGroup.Item
      action
      onClick={open}
      className="bg-dark text-light border-secondary">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <Badge bg={healthColor[health]}>&nbsp;</Badge>
        <code className="text-info">{search.requestPostId.slice(0, 8)}</code>
        <span>{found}/{search.targetDonors ?? '?'} donors</span>
        <span className="text-muted">· wave {search.waveHistory.length}</span>
        <span className="text-muted">
          · lvl {search.currentLevel ?? 0} / retry {search.currentRetryCount ?? 0}
        </span>
        <span className="ms-auto text-muted small">
          {search.lastUpdatedAt ? `updated ${timeAgo(search.lastUpdatedAt)}` : 'no wave yet'}
        </span>
      </div>
    </ListGroup.Item>
  )
}

export default FeedRow

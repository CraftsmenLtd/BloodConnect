import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Spinner, Button, Form } from 'react-bootstrap'
import HealthStrip from '../components/HealthStrip'
import type { FeedFilter } from '../components/HealthStrip'
import LiveFeed from '../features/live/LiveFeed'
import { useLiveFeed } from '../features/live/useLiveFeed'
import { useAutoRefresh } from '../features/live/useAutoRefresh'
import { LIVE_REFRESH_INTERVAL_MS } from '../constants/constants'
import { timeAgo } from '../data/format'

const Live = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [paused, setPaused] = useState(false)
  const { active, stuckIds, counts, loading, error, lastUpdatedAt, refresh } = useLiveFeed()

  useAutoRefresh(refresh, LIVE_REFRESH_INTERVAL_MS, !paused)

  return (
    <Container fluid className="p-3 text-light" style={{ overflowY: 'auto' }}>
      <div className="d-flex align-items-center mb-3 gap-2">
        <h5 className="mb-0 me-auto">Live</h5>
        {loading && <Spinner animation="border" size="sm" variant="primary" />}
        {lastUpdatedAt && (
          <span className="text-muted small">updated {timeAgo(lastUpdatedAt)}</span>
        )}
        <Form.Check
          type="switch"
          id="auto-refresh"
          label="Auto"
          checked={!paused}
          onChange={() => setPaused((value) => !value)}
        />
        <Button size="sm" variant="outline-light" onClick={refresh}>Refresh</Button>
      </div>
      {error && <div className="text-danger mb-2">{error}</div>}
      <HealthStrip
        counts={counts}
        filter={filter}
        onSelect={setFilter}
        onUnderserved={() => navigate('/searches')}
      />
      <LiveFeed active={active} stuckIds={stuckIds} filter={filter} />
    </Container>
  )
}

export default Live

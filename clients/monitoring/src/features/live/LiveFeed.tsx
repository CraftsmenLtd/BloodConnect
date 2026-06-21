import { ListGroup } from 'react-bootstrap'
import FeedRow from './FeedRow'
import type { Health } from './FeedRow'
import type { FeedFilter } from '../../components/HealthStrip'
import type { DonorSearch } from '../../domain/types'
import { ONE_HOUR_IN_MS, STUCK_AFTER_MS } from '../../constants/constants'

const healthOf = (search: DonorSearch, stuck: boolean, now: number): Health => {
  if (stuck) return 'stuck'
  if (!search.lastUpdatedAt) return 'slow'
  const age = now - new Date(search.lastUpdatedAt).getTime()
  if (age > STUCK_AFTER_MS) return 'stuck'
  if (age > STUCK_AFTER_MS / 2) return 'slow'

  return 'ok'
}

const matches = (search: DonorSearch, filter: FeedFilter, stuck: boolean, now: number): boolean => {
  if (filter === 'stuck') return stuck
  if (filter === 'lastHour') return now - new Date(search.createdAt).getTime() <= ONE_HOUR_IN_MS

  return true
}

type LiveFeedProps = {
  active: DonorSearch[];
  stuckIds: Set<string>;
  filter: FeedFilter;
}

const LiveFeed = ({ active, stuckIds, filter }: LiveFeedProps) => {
  const now = Date.now()
  const rows = active.filter(
    (search) => matches(search, filter, stuckIds.has(search.requestPostId), now))

  if (rows.length === 0) {
    return (
      <div className="text-muted">
        No active searches match. Clear the filter, or wait for the next refresh.
      </div>
    )
  }

  return (
    <ListGroup>
      {rows.map((search) => (
        <FeedRow
          key={`${search.seekerId}#${search.createdAt}#${search.requestPostId}`}
          search={search}
          health={healthOf(search, stuckIds.has(search.requestPostId), now)} />
      ))}
    </ListGroup>
  )
}

export default LiveFeed

import { ProgressBar, Badge } from 'react-bootstrap'
import type { DonorSearch } from '../../domain/types'

const ProgressTimeline = ({ search }: { search: DonorSearch }) => {
  const found = search.donorsFoundSoFar ?? 0
  const target = search.targetDonors ?? 0
  const pct = target > 0 ? Math.min(100, Math.round((found / target) * 100)) : 0

  return (
    <div className="mb-3">
      <div className="d-flex gap-2 mb-1 align-items-center">
        <Badge bg={search.status === 'PENDING' ? 'primary' : 'secondary'}>{search.status}</Badge>
        {search.completionReason && <Badge bg="warning">{search.completionReason}</Badge>}
        <span className="ms-auto text-muted">{found}/{target || '?'} donors</span>
      </div>
      <ProgressBar now={pct} label={`${pct}%`} variant={pct >= 100 ? 'success' : 'info'} />
      <div className="small text-muted mt-1">
        level {search.currentLevel ?? 0} · retry {search.currentRetryCount ?? 0}
        {' · '}{search.waveHistory.length} waves
      </div>
    </div>
  )
}

export default ProgressTimeline

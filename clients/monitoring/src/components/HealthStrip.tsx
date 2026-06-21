import { Card } from 'react-bootstrap'
import type { LiveCounts } from '../features/live/useLiveFeed'

export type FeedFilter = 'all' | 'stuck' | 'lastHour'

type Tile = {
  key: FeedFilter | 'underserved';
  label: string;
  value: number;
  variant: string;
}

type HealthStripProps = {
  counts: LiveCounts;
  filter: FeedFilter;
  onSelect: (filter: FeedFilter) => void;
  onUnderserved: () => void;
}

const HealthStrip = ({ counts, filter, onSelect, onUnderserved }: HealthStripProps) => {
  const tiles: Tile[] = [
    { key: 'all', label: 'Active', value: counts.active, variant: 'primary' },
    { key: 'stuck', label: 'Stuck', value: counts.stuck, variant: 'danger' },
    { key: 'underserved', label: 'Underserved', value: counts.underserved, variant: 'warning' },
    { key: 'lastHour', label: 'Last 1h', value: counts.lastHour, variant: 'info' },
  ]

  const handleClick = (tile: Tile) =>
    tile.key === 'underserved' ? onUnderserved() : onSelect(tile.key)

  return (
    <div className="d-flex gap-2 flex-wrap mb-3">
      {tiles.map((tile) => (
        <Card
          key={tile.key}
          bg={tile.key === filter ? tile.variant : 'dark'}
          text="light"
          role="button"
          onClick={() => handleClick(tile)}
          className={`border-${tile.variant}`}
          style={{ minWidth: '8rem', cursor: 'pointer' }}>
          <Card.Body className="py-2 px-3">
            <div className="fs-4 fw-bold">{tile.value}</div>
            <div className="small text-uppercase">{tile.label}</div>
          </Card.Body>
        </Card>
      ))}
    </div>
  )
}

export default HealthStrip

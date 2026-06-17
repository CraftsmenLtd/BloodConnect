import { ListGroup } from 'react-bootstrap'
import FeedRow from '../live/FeedRow'
import type { Health } from '../live/FeedRow'
import type { DonorSearch } from '../../domain/types'

type SearchSectionProps = {
  title: string;
  items: DonorSearch[];
  health: Health;
}

const SearchSection = ({ title, items, health }: SearchSectionProps) => (
  <div className="mb-4">
    <h5 className="text-light">
      {title} <span className="text-muted">({items.length})</span>
    </h5>
    {items.length === 0
      ? <div className="text-muted">None</div>
      : (
        <ListGroup>
          {items.map((search) => (
            <FeedRow
              key={`${search.seekerId}#${search.createdAt}#${search.requestPostId}`}
              search={search}
              health={health} />
          ))}
        </ListGroup>
      )}
  </div>
)

export default SearchSection

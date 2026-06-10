import { Stack } from 'react-bootstrap'
import DonorSearchCard from './DonorSearchCard'
import type { DonorSearchDynamoDBUnmarshaledItem } from '../../constants/types'

const DonorSearchList = ({ title, items }: {
  title: string;
  items: DonorSearchDynamoDBUnmarshaledItem[];
}) => (
  <div className="mb-4">
    <h5 className="text-light">
      {title} <span className="text-muted">({items.length})</span>
    </h5>
    <Stack gap={2}>
      {items.map((item, index) => (
        <DonorSearchCard data={item} key={index} />
      ))}
      {items.length === 0 && <div className="text-muted">None</div>}
    </Stack>
  </div>
)

export default DonorSearchList

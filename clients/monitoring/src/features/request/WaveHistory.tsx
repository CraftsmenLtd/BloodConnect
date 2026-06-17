import { Table } from 'react-bootstrap'
import { timeAgo } from '../../data/format'
import type { Wave } from '../../domain/types'

const WaveHistory = ({ waves }: { waves: Wave[] }) => {
  if (waves.length === 0) return <div className="text-muted">No waves yet.</div>

  return (
    <Table size="sm" variant="dark" className="mb-3">
      <thead>
        <tr><th>#</th><th>Level</th><th>Retry</th><th>Found</th><th>When</th></tr>
      </thead>
      <tbody>
        {waves.map((wave, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{wave.level}</td>
            <td>{wave.retryCount}</td>
            <td>{wave.donorsFound}</td>
            <td>{timeAgo(wave.at)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default WaveHistory

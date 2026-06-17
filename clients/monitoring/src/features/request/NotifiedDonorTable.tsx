import { Table } from 'react-bootstrap'
import type { NotifiedDonor } from '../../domain/types'

const NotifiedDonorTable = ({ donors }: { donors: NotifiedDonor[] }) => {
  if (donors.length === 0) return <div className="text-muted">No donors notified yet.</div>

  return (
    <Table size="sm" variant="dark" hover>
      <thead>
        <tr><th>Donor</th><th>Status</th><th>Distance</th><th>Area</th></tr>
      </thead>
      <tbody>
        {donors.map((donor) => (
          <tr key={donor.donorId}>
            <td><code>{donor.donorId.slice(0, 8)}</code></td>
            <td>{donor.status}</td>
            <td>{donor.distance} km</td>
            <td>{donor.area}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default NotifiedDonorTable

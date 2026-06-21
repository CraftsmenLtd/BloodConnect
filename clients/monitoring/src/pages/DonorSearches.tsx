import { useEffect, useMemo, useState } from 'react'
import { Container, Spinner } from 'react-bootstrap'
import { useDdbClient } from '../data/ddbClient'
import { toDonorSearch } from '../data/unmarshal'
import { STUCK_AFTER_MS } from '../constants/constants'
import { queryStuckSearches, queryUnderservedSearches } from '../queries/Requests'
import type { DonorSearch } from '../domain/types'
import SearchSection from '../features/searches/SearchSection'

const DonorSearches = () => {
  const client = useDdbClient()
  const [loading, setLoading] = useState(true)
  const [stuck, setStuck] = useState<DonorSearch[]>([])
  const [underserved, setUnderserved] = useState<DonorSearch[]>([])

  useEffect(() => {
    const stuckBeforeIso = new Date(Date.now() - STUCK_AFTER_MS).toISOString()
    setLoading(true)
    Promise.all([
      queryStuckSearches(client, { stuckBeforeIso }),
      queryUnderservedSearches(client)
    ])
      .then(([stuckResult, underservedResult]) => {
        setStuck(stuckResult.items.map(toDonorSearch))
        setUnderserved(underservedResult.items.map(toDonorSearch))
      })
      .catch((err) => { alert(err) })
      .finally(() => { setLoading(false) })
  }, [client])

  const sections = useMemo(() => ([
    { title: 'Stuck searches', items: stuck, health: 'stuck' as const },
    { title: 'Underserved searches', items: underserved, health: 'slow' as const }
  ]), [stuck, underserved])

  return (
    <Container className="p-4" style={{ flexGrow: 1, overflowY: 'auto' }}>
      {loading
        ? <Spinner animation="border" role="status" variant="primary" />
        : sections.map((section) => (
          <SearchSection
            key={section.title}
            title={section.title}
            items={section.items}
            health={section.health} />
        ))}
    </Container>
  )
}

export default DonorSearches

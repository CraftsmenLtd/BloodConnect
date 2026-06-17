import { useState } from 'react'
import type { FormEvent } from 'react'
import { Container, Form, Button, Spinner } from 'react-bootstrap'
import { useDdbClient } from '../data/ddbClient'
import { toDonorSearch } from '../data/unmarshal'
import { querySearchesBySeeker } from '../queries/Requests'
import type { DonorSearch } from '../domain/types'
import SearchSection from '../features/searches/SearchSection'

const Lookup = () => {
  const client = useDdbClient()
  const [seekerId, setSeekerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DonorSearch[]>()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = seekerId.trim()
    if (!trimmed) return
    setLoading(true)
    querySearchesBySeeker(client, { seekerId: trimmed })
      .then((res) => setResults(res.items.map(toDonorSearch)))
      .catch((err) => { alert(err) })
      .finally(() => { setLoading(false) })
  }

  return (
    <Container className="p-4 text-light" style={{ flexGrow: 1, overflowY: 'auto' }}>
      <h5>Lookup</h5>
      <p className="text-muted small">Find every donor search for a seeker id.</p>
      <Form onSubmit={submit} className="mb-3" style={{ maxWidth: '28rem' }}>
        <div className="d-flex gap-2">
          <Form.Control
            value={seekerId}
            onChange={(event) => setSeekerId(event.target.value)}
            placeholder="seeker id"
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Find'}
          </Button>
        </div>
      </Form>
      {results && <SearchSection title="Searches" items={results} health="ok" />}
    </Container>
  )
}

export default Lookup

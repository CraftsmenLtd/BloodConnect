import { useEffect, useMemo, useState } from 'react'
import { Container, Spinner } from 'react-bootstrap'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { useAws } from '../hooks/AwsContext'
import { STUCK_AFTER_MS } from '../constants/constants'
import { queryStuckSearches, queryUnderservedSearches } from '../queries/Requests'
import type { DonorSearchDynamoDBUnmarshaledItem } from '../constants/types'
import DonorSearchList from '../components/DonorSearch/DonorSearchList'

const DonorSearches = () => {
  const { credentials } = useAws()
  const [loading, setLoading] = useState(true)
  const [stuck, setStuck] = useState<DonorSearchDynamoDBUnmarshaledItem[]>([])
  const [underserved, setUnderserved] = useState<DonorSearchDynamoDBUnmarshaledItem[]>([])

  const dynamodbClient = useMemo(() => new DynamoDBClient({
    region: import.meta.env.VITE_AWS_REGION as string,
    credentials: credentials!,
  }), [credentials])

  useEffect(() => {
    const stuckBeforeIso = new Date(Date.now() - STUCK_AFTER_MS).toISOString()
    setLoading(true)
    Promise.all([
      queryStuckSearches(dynamodbClient, { stuckBeforeIso }),
      queryUnderservedSearches(dynamodbClient)
    ])
      .then(([stuckResult, underservedResult]) => {
        setStuck(stuckResult.items)
        setUnderserved(underservedResult.items)
      })
      .catch((err) => { alert(err) })
      .finally(() => { setLoading(false) })
  }, [dynamodbClient])

  return (
    <Container className="p-4" style={{ flexGrow: 1, overflowY: 'auto' }}>
      {loading
        ? <Spinner animation="border" role="status" variant="primary" />
        : (
          <>
            <DonorSearchList title="Stuck searches" items={stuck} />
            <DonorSearchList title="Underserved searches" items={underserved} />
          </>
        )}
    </Container>
  )
}

export default DonorSearches

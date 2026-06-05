import { useState, useEffect, useRef } from 'react'
import type { DonationSearchStatusInfo } from '../../../../commons/dto/DonationDTO'
import { DonorSearchStatus } from '../../../../commons/dto/DonationDTO'
import { fetchSingleDonationPost } from '../../../donationWorkflow/donationService'
import { useFetchClient } from '../../../setup/clients/useFetchClient'
import type { HttpClient } from '../../../setup/clients/HttpClient'

const POLL_INTERVAL_MS = 15_000

type UseDonationSearchStatusResult = {
  searchStatus: DonationSearchStatusInfo | null;
  isLoading: boolean;
  error: string | null;
}

const useDonationSearchStatus = (
  seekerId: string,
  requestPostId: string,
  createdAt: string
): UseDonationSearchStatusResult => {
  const fetchClient = useFetchClient()
  const [searchStatus, setSearchStatus] = useState<DonationSearchStatusInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchStatusRef = useRef<DonationSearchStatusInfo | null>(null)
  const fetchClientRef = useRef<HttpClient>(fetchClient)
  searchStatusRef.current = searchStatus
  fetchClientRef.current = fetchClient

  useEffect(() => {
    const fetchStatus = async(): Promise<void> => {
      try {
        const response = await fetchSingleDonationPost(requestPostId, createdAt, fetchClientRef.current)
        setSearchStatus(response.data?.searchStatus ?? null)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load search status')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchStatus()

    const intervalId = setInterval(() => {
      if (searchStatusRef.current?.donorSearchStatus !== DonorSearchStatus.COMPLETED) {
        void fetchStatus()
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [requestPostId, createdAt, seekerId])

  return { searchStatus, isLoading, error }
}

export default useDonationSearchStatus

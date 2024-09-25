import {
  fetchUserAttributes,
  FetchUserAttributesOutput
} from 'aws-amplify/auth'
import { useEffect, useState } from 'react'

type UseAuthenticatedUserReturn = {
  user: FetchUserAttributesOutput | null;
  loading: boolean;
  error: string | null;
}

const useAuthenticatedUser = (): UseAuthenticatedUserReturn => {
  const [user, setUser] = useState<FetchUserAttributesOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrentUser = async(): Promise<void> => {
      try {
        const currentUser = await fetchUserAttributes()
        setUser(currentUser)
        setError(null)
      } catch (e) {
        setUser(null)
        setError(e instanceof Error ? e.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser().catch((e) => {
      setError(
        e instanceof Error ? e.message : 'Failed to fetch user attributes:'
      )
      setLoading(false)
    })
  }, [])

  return { user, loading, error }
}

export default useAuthenticatedUser

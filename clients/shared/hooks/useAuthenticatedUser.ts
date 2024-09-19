import { fetchUserAttributes, FetchUserAttributesOutput } from 'aws-amplify/auth'
import { useEffect, useState } from 'react'

interface UseAuthenticatedUserReturn {
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
      } catch (error) {
        setUser(null)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser().catch((error) => {
      setError(error instanceof Error ? error.message : 'Failed to fetch user attributes:')
      setLoading(false)
    })
  }, [])

  return { user, loading, error }
}

export default useAuthenticatedUser

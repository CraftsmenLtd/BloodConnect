import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import type { AuthSession } from 'aws-amplify/auth'

type AwsCredentials = AuthSession['credentials']

const AwsContext = createContext<{
  loading: boolean; error: Error | null; credentials: AwsCredentials | null;
}>({
  loading: false, error: null, credentials: undefined
})

export const AwsProvider = ({ children }: { children: ReactNode }) => {
  const [credentials, setCredentials] = useState<AwsCredentials>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)


  useEffect(() => {
    setLoading(true)
    fetchAuthSession()
      .then((session) => {
        setCredentials(session.credentials)
        setLoading(false)
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error)
        setError(error)
      }).finally(() => { setLoading(false) })
  }, [])


  return <AwsContext.Provider value={{ credentials, error, loading }}>
    {children}
  </AwsContext.Provider>
}

export const useAws = () => useContext(AwsContext)

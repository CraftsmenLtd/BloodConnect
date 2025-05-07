import type { AuthSession } from 'aws-amplify/auth'
import { fetchAuthSession } from 'aws-amplify/auth'
import { useEffect, useState } from 'react'

export const useAws = (): AuthSession['credentials'] | undefined => {
  const [state, setState] = useState<AuthSession['credentials']>()

  useEffect(() => {
    fetchAuthSession().then((session) => {
      setState(session.credentials)
    // eslint-disable-next-line no-console
    }).catch(console.error)
  }, [])

  return state
}

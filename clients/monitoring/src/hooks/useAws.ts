
import { AuthSession, fetchAuthSession } from "aws-amplify/auth"
import { useEffect, useState } from "react"

export const useAws = () => {
    const [state, setState] = useState<AuthSession>()

    useEffect(() => {
        fetchAuthSession().then((session) => {
            setState(session)
        })
    }, [])

    return state?.credentials
}

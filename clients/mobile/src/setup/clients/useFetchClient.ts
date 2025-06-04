import { useContext } from 'react'
import { AuthContext } from '../../authentication/context/AuthContext'
import { FetchClient } from './FetchClient'
import Constants from 'expo-constants'
import type { HttpClient } from './HttpClient'
const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

export const useFetchClient = (): HttpClient => {
  const { logoutUser } = useContext(AuthContext)

  return new FetchClient(API_BASE_URL, logoutUser)
}

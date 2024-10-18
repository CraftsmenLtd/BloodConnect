import Constants from 'expo-constants'
import { FetchClient } from './FetchClient'

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

const fetchClient = new FetchClient(API_BASE_URL)

export default fetchClient

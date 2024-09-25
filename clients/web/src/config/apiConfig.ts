import { fetchAuthSession } from '@aws-amplify/auth'
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  async(config) => {
    const idToken = (
      await fetchAuthSession()
    ).tokens?.idToken?.toString()
    if (idToken !== undefined && idToken !== null) {
      config.headers.Authorization = `Bearer ${idToken}`
    }
    return config
  },
  async(error) => Promise.reject(error)
)

export default api

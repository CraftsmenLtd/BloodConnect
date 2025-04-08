import { getAuthSession } from '../platform/aws/auth/awsAuth'
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  async(config) => {
    const idToken = (await getAuthSession()).tokens?.idToken?.toString()
    if (idToken !== undefined && idToken !== null) {
      config.headers.Authorization = `Bearer ${idToken}`
    }
    return config
  },
  async(error) => Promise.reject(error)
)

export default api

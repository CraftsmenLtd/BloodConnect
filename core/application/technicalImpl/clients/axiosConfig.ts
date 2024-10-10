import axios from 'axios'

const axiosConfig = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
})

export default axiosConfig

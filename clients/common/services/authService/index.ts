import { post } from '../api'
import type { AxiosResponse } from 'axios'

const authService = {
  registerOrganization: async(data: object): Promise<AxiosResponse<unknown>> => post('/auth/register-organization', data)
}

export default authService

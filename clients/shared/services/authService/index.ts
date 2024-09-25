import { post } from '../api'
import { AxiosResponse } from 'axios'

const authService = {
  registerOrganization: async(data: object): Promise<AxiosResponse<any>> => {
    return post('/auth/register-organization', data)
  }
}

export default authService

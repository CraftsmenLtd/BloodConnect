import { post } from '../api'

const authService = {
  registerOrganization: async(data: object) => {
    return await post('/auth/register-organization', data)
  }
}

export default authService

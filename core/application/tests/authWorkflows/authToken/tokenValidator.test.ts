import { sign } from 'jsonwebtoken'
import { jwtSecret } from '../../../authWorkflows/authToken/constants'
import getAuthToken from '../../../authWorkflows/authToken/tokenGenerator'
import validateToken from '../../../authWorkflows/authToken/tokenValidator'

describe('tokenValidator', () => {
  const tokenPayload = { email: 'a@b.com', username: 'test', role: 'admin' }

  it('should return payload for valid token', () => {
    const token = getAuthToken(tokenPayload)
    const jwtPayload = validateToken<typeof tokenPayload>(token)
    const { email, username, role } = jwtPayload
    expect(email).toEqual(tokenPayload.email)
    expect(username).toEqual(tokenPayload.username)
    expect(role).toEqual(tokenPayload.role)
  })

  it('should return payload for valid token', () => {
    try {
      validateToken<typeof tokenPayload>('invalid_token_passed')
      expect(true).toBe(false)
    } catch (e) {
      expect((e as Error).name).toBe('InvalidTokenError')
    }
  })

  it('should return payload for valid token', () => {
    try {
      const expiredToken = sign(tokenPayload, jwtSecret, { expiresIn: -5 })
      validateToken<typeof tokenPayload>(expiredToken)
      expect(true).toBe(false)
    } catch (e) {
      const error = e as Error
      expect(error.name).toBe('InvalidTokenError')
      expect(error.message.includes('TokenExpiredError')).toBe(true)
    }
  })
})

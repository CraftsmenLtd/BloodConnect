import getAuthToken from '../../../authWorkflows/authToken/tokenGenerator'
import { jwtSecret } from '../../../authWorkflows/authToken/constants'
import { JwtPayload, verify, JsonWebTokenError } from 'jsonwebtoken'

describe('tokenGenerator', () => {
  const tokenPayload = { email: 'a@b.com', username: 'test', role: 'admin' }

  const getExpiryOfJsonToken = (decodedPayload: string | JwtPayload): number =>
    typeof decodedPayload === 'string' ? JSON.parse(decodedPayload).exp : decodedPayload.exp

  it('should generate a valid jwt token with 3 parts separated by dot', () => {
    const token = getAuthToken(tokenPayload)
    expect(token.split('.').length).toBe(3)
  })

  it('should generate a valid jwt token valid till day end', () => {
    const token = getAuthToken(tokenPayload)
    const dayEnd = Math.floor(new Date().setUTCHours(23, 59, 59) / 1000)
    const decodedPayloadExpiry = getExpiryOfJsonToken(verify(token, jwtSecret))
    expect(decodedPayloadExpiry).toBe(dayEnd)
  })

  it('should contain valid payload in token', () => {
    const token = getAuthToken(tokenPayload)
    const jwtPayload = verify(token, jwtSecret)
    const { email, username, role } = jwtPayload === 'string' ? JSON.parse(jwtPayload) : jwtPayload
    expect(email).toEqual(tokenPayload.email)
    expect(username).toEqual(tokenPayload.username)
    expect(role).toEqual(tokenPayload.role)
  })

  it('should generate a valid jwt token with mentioned validity if expiresIn passed', () => {
    const token = getAuthToken(tokenPayload, 5)
    const fiveSecsLaterTime = Math.floor(Date.now() / 1000) + 5
    const decodedPayloadExpiry = getExpiryOfJsonToken(verify(token, jwtSecret))
    expect(decodedPayloadExpiry).toBe(fiveSecsLaterTime)
  })

  it('should throw error if wrong secret passed', () => {
    try {
      const token = getAuthToken(tokenPayload)
      verify(token, 'mock_secret')
      expect(true).toBe(false)
    } catch (e) {
      expect((e as JsonWebTokenError).name).toBe('JsonWebTokenError')
    }
  })
})

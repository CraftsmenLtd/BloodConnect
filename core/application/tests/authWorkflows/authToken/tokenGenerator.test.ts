import getAuthToken from '../../../authWorkflows/authToken/tokenGenerator'
import { JwtPayload } from 'jsonwebtoken'
import validateToken from '@application/authWorkflows/authToken/tokenValidator'

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
    const decodedPayloadExpiry = getExpiryOfJsonToken(validateToken(token))
    expect(decodedPayloadExpiry).toBe(dayEnd)
  })

  it('should contain valid payload in token', () => {
    const token = getAuthToken(tokenPayload)
    const jwtPayload = validateToken<typeof tokenPayload>(token)
    const { email, username, role } = jwtPayload
    expect(email).toEqual(tokenPayload.email)
    expect(username).toEqual(tokenPayload.username)
    expect(role).toEqual(tokenPayload.role)
  })

  it('should generate a valid jwt token with mentioned validity if positive expiresIn passed', () => {
    const token = getAuthToken(tokenPayload, 5)
    const fiveSecsLaterTime = Math.floor(Date.now() / 1000) + 5
    const decodedPayloadExpiry = getExpiryOfJsonToken(validateToken(token))
    expect(decodedPayloadExpiry).toBe(fiveSecsLaterTime)
  })

  it('should generate a valid jwt token with validity until day end if 0 expiresIn is passed', () => {
    const token = getAuthToken(tokenPayload, -5)
    const dayEnd = Math.floor(new Date().setUTCHours(23, 59, 59) / 1000)
    const decodedPayloadExpiry = getExpiryOfJsonToken(validateToken(token))
    expect(decodedPayloadExpiry).toBe(dayEnd)
  })

  it('should generate a valid jwt token with validity until day end if negative expiresIn is passed', () => {
    const token = getAuthToken(tokenPayload, 0)
    const dayEnd = Math.floor(new Date().setUTCHours(23, 59, 59) / 1000)
    const decodedPayloadExpiry = getExpiryOfJsonToken(validateToken(token))
    expect(decodedPayloadExpiry).toBe(dayEnd)
  })
})

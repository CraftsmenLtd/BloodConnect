import validateToken from '@application/authWorkflows/authToken/tokenValidator'
import { getRefreshToken, getBearerAuthToken, getAuthToken } from '../../authWorkflows/authWorkflowUseCases'
import { getDaysInSecs } from '@commons/libs/dateTimeUtils'
import { JwtPayload } from 'jsonwebtoken'

describe('authWorkflowUseCases', () => {
  describe('getTokens', () => {
    const tokenPayload = { email: 'a@b.com', username: 'test', role: 'admin' }

    describe('getRefreshToken', () => {
      it('should return token with validity of 30 days for mobile client', () => {
        const refreshToken = getRefreshToken(tokenPayload, 'mobile')
        const sevenDaysValidToken = Math.floor(Date.now() / 1000) + getDaysInSecs(30)
        const decodedPayload = validateToken<{ exp: number }>(refreshToken)
        expect(decodedPayload.exp).toBe(sevenDaysValidToken)
      })

      it('should return token with validity of 7 days for web client', () => {
        const refreshToken = getRefreshToken(tokenPayload, 'web')
        const sevenDaysValidToken = Math.floor(Date.now() / 1000) + getDaysInSecs(7)
        const decodedPayload = validateToken<{ exp: number }>(refreshToken)
        expect(decodedPayload.exp).toBe(sevenDaysValidToken)
      })
    })

    describe('getAuthToken', () => {
      const getExpiryOfJsonToken = (decodedPayload: string | JwtPayload): number =>
        typeof decodedPayload === 'string' ? JSON.parse(decodedPayload).exp : decodedPayload.exp

      it('should generate a valid jwt token valid till day end', () => {
        const token = getAuthToken(tokenPayload)
        const dayEnd = Math.floor(new Date().setUTCHours(23, 59, 59) / 1000)
        const decodedPayloadExpiry = getExpiryOfJsonToken(validateToken(token))
        expect(decodedPayloadExpiry).toBe(dayEnd)
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
  })

  describe('getBearerAuthToken', () => {
    it('should return token if contains Bearer token', () => {
      expect(getBearerAuthToken('Bearer token')).toBe('token')
    })

    it('should return undefined if passed empty string', () => {
      expect(getBearerAuthToken('')).toBe(undefined)
    })

    it('should return if passed ill formatted bearer token string', () => {
      expect(getBearerAuthToken('BearerToken')).toBe(undefined)
    })
  })
})

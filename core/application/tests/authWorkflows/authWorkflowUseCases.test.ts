import validateToken from '@application/authWorkflows/authToken/tokenValidator'
import { getAuthAndRefreshTokens } from '../../authWorkflows/authWorkflowUseCases'
import { getDaysInSecs } from '@commons/libs/dateTimeUtils'

describe('authWorkflowUseCases', () => {
  describe('getAuthAndRefreshTokens', () => {
    const tokenPayload = { email: 'a@b.com', username: 'test', role: 'admin' }

    it('should return token with validity for the rest of the day for mobile client', () => {
      const authAndRefreshTokens = getAuthAndRefreshTokens(tokenPayload, 'mobile')
      const dayEnd = Math.floor(new Date().setUTCHours(23, 59, 59) / 1000)
      const decodedPayload = validateToken<{ exp: number }>(authAndRefreshTokens.authToken)
      expect(decodedPayload.exp).toBe(dayEnd)
    })

    it('should return token with validity for the rest of the day for web client', () => {
      const authAndRefreshTokens = getAuthAndRefreshTokens(tokenPayload, 'web')
      const dayEnd = Math.floor(new Date().setUTCHours(23, 59, 59) / 1000)
      const decodedPayload = validateToken<{ exp: number }>(authAndRefreshTokens.authToken)
      expect(decodedPayload.exp).toBe(dayEnd)
    })

    it('should return token with validity of 30 days for mobile client', () => {
      const authAndRefreshTokens = getAuthAndRefreshTokens(tokenPayload, 'mobile')
      const sevenDaysValidToken = Math.floor(Date.now() / 1000) + getDaysInSecs(30)
      const decodedPayload = validateToken<{ exp: number }>(authAndRefreshTokens.refreshToken)
      expect(decodedPayload.exp).toBe(sevenDaysValidToken)
    })

    it('should return token with validity of 7 days for web client', () => {
      const authAndRefreshTokens = getAuthAndRefreshTokens(tokenPayload, 'web')
      const sevenDaysValidToken = Math.floor(Date.now() / 1000) + getDaysInSecs(7)
      const decodedPayload = validateToken<{ exp: number }>(authAndRefreshTokens.refreshToken)
      expect(decodedPayload.exp).toBe(sevenDaysValidToken)
    })
  })
})

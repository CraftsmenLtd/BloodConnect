import ClientType from '@commons/libs/constants/ClientType'
import getAuthToken from './authToken/tokenGenerator'
import { getDaysInSecs } from '@commons/libs/dateTimeUtils'

export function getAuthAndRefreshTokens(tokenPayload: object, clientType: ClientType): { authToken: string; refreshToken: string } {
  const refreshTokenValidityDays = clientType === 'mobile' ? 30 : 7
  return {
    authToken: getAuthToken(tokenPayload),
    refreshToken: getAuthToken(tokenPayload, getDaysInSecs(refreshTokenValidityDays))
  }
}

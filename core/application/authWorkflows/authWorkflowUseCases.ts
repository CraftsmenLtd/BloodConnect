import ClientType from '@commons/libs/constants/ClientType'
import getJwtToken from './authToken/tokenGenerator'
import { getDaysInSecs, getRemainingSecsOfDay } from '@commons/libs/dateTimeUtils'
const RefreshTokenValidityInDaysForClient: Record<ClientType, number> = {
  mobile: 30,
  web: 7
}

export function getRefreshToken(tokenPayload: object, clientType: ClientType): string {
  return getJwtToken(tokenPayload, getDaysInSecs(RefreshTokenValidityInDaysForClient[clientType]))
}

export function getAuthToken(tokenPayload: object, expiresInSeconds: number = 0): string {
  const expiresIn = expiresInSeconds > 0 ? expiresInSeconds : getRemainingSecsOfDay()
  return getJwtToken(tokenPayload, expiresIn)
}

export function getBearerAuthToken(bearerToken: string): string | undefined {
  if (bearerToken.startsWith('Bearer ')) {
    return bearerToken.split(' ')[1]
  }
  return undefined
}

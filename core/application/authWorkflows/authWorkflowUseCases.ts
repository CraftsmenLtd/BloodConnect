import ClientType from '../../../commons/libs/constants/ClientType'
import getJwtToken from './authToken/tokenGenerator'
import { getDaysInSecs, getRemainingSecsOfDay } from '../../../commons/libs/dateTimeUtils'
import validateToken from '../../application/authWorkflows/authToken/tokenValidator'
import appLogger from '../../../commons/libs/logger/ApplicationLogger'
import { executionEnv } from '../../application/authWorkflows/authToken/constants'
import InvalidTokenError from '../../application/authWorkflows/errors/InvalidTokenError'

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

export function getAuthTokenFromRefreshToken(refreshToken?: string): string | undefined {
  try {
    // TODO: needs to be checked in the database
    const { exp, ...tokenPayload } = validateToken(refreshToken ?? '')
    return getAuthToken(tokenPayload)
  } catch (err) {
    appLogger(executionEnv).info('Refresh token validation error', (err as InvalidTokenError).message)
  }
}

export function getPayloadFromBearerToken(bearerToken: string): object | undefined {
  const token = getBearerAuthToken(bearerToken)
  try {
    return validateToken(token ?? '')
  } catch (err) {
    appLogger(executionEnv).info('Token validation error', (err as InvalidTokenError).message)
  }
}

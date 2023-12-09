import { sign } from 'jsonwebtoken'
import { getRemainingSecsOfDay } from '@commons/libs/dateTimeUtils'
import { jwtSecret } from './constants'

export default function getAuthToken(payload: object, expiresInSeconds: number = 0): string {
  const expiresIn = expiresInSeconds > 0 ? expiresInSeconds : getRemainingSecsOfDay()
  return sign(payload, jwtSecret, { expiresIn })
}

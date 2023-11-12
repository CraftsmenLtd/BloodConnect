import { sign } from 'jsonwebtoken'
import { getRemainingMsOfDay } from '@commons/libs/dateTimeUtils'
import { jwtSecret } from './constants'

export default function getAuthToken(payload: object, expiresInSeconds?: number): string {
  const expiresIn = expiresInSeconds ?? getRemainingMsOfDay() / 1000
  return sign(payload, jwtSecret, { expiresIn })
}

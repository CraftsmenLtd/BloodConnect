import { sign } from 'jsonwebtoken'
import { jwtSecret } from './constants'

export default function getJwtToken(payload: object, expiresInSeconds: number): string {
  if (expiresInSeconds <= 0) {
    return ''
  }
  return sign(payload, jwtSecret, { expiresIn: expiresInSeconds })
}

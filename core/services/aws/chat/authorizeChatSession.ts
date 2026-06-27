import type {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent,
  PolicyDocument,
  StatementEffect
} from 'aws-lambda'
import type { JsonWebKeyInput } from 'crypto'
import { createPublicKey } from 'crypto'
import type { JwtPayload } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'

// WebSocket request authorizer for the chat $connect route. The Cognito JWT is read
// from the Authorization header only (never the query string, ADV-005), its signature
// is verified against the user-pool JWKS, and the verified `sub` is handed to the
// connect/sendmessage handlers as the authoritative participant id.
const ALLOW: StatementEffect = 'Allow'
const DENY: StatementEffect = 'Deny'
const INVOKE_ACTION = 'execute-api:Invoke'
const ACCEPTED_TOKEN_USES = ['access', 'id']
const BEARER_PREFIX = /^Bearer\s+/i

type Jwk = { kid?: string; [claim: string]: unknown }

const issuer = (): string =>
  `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.USER_POOL_ID}`

const extractBearerToken = (event: APIGatewayRequestAuthorizerEvent): string | undefined => {
  const header = event.headers?.Authorization ?? event.headers?.authorization
  if (header === undefined || header === null) {
    return undefined
  }

  return header.replace(BEARER_PREFIX, '').trim() || undefined
}

const fetchSigningKey = async (kid: string): Promise<ReturnType<typeof createPublicKey>> => {
  const response = await fetch(`${issuer()}/.well-known/jwks.json`)
  const { keys } = (await response.json()) as { keys: Jwk[] }
  const jwk = keys.find((key) => key.kid === kid)
  if (jwk === undefined) {
    throw new Error('No JWKS key matches the token kid')
  }

  return createPublicKey({ key: jwk, format: 'jwk' } as unknown as JsonWebKeyInput)
}

const assertClaims = (claims: JwtPayload): void => {
  const tokenUse = claims.token_use as string | undefined
  if (tokenUse === undefined || !ACCEPTED_TOKEN_USES.includes(tokenUse)) {
    throw new Error('Unexpected token_use claim')
  }
  const audience = (claims.aud ?? claims.client_id) as string | undefined
  if (audience !== process.env.USER_POOL_CLIENT_ID) {
    throw new Error('Token audience mismatch')
  }
}

const verifyToken = async (token: string): Promise<string> => {
  const decoded = jwt.decode(token, { complete: true })
  if (decoded === null) {
    throw new Error('Malformed token')
  }
  const key = await fetchSigningKey(decoded.header.kid ?? '')
  const claims = jwt.verify(token, key, { algorithms: ['RS256'], issuer: issuer() }) as JwtPayload
  assertClaims(claims)
  if (typeof claims.sub !== 'string' || claims.sub === '') {
    throw new Error('Missing subject claim')
  }

  return claims.sub
}

const buildPolicy = (
  effect: StatementEffect,
  methodArn: string,
  userId?: string
): APIGatewayAuthorizerResult => {
  const policyDocument: PolicyDocument = {
    Version: '2012-10-17',
    Statement: [{ Action: INVOKE_ACTION, Effect: effect, Resource: methodArn }]
  }

  return {
    principalId: userId ?? 'unauthorized',
    policyDocument,
    context: userId === undefined ? undefined : { userId }
  }
}

const authorizeChatSession = async (
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const token = extractBearerToken(event)
  if (token === undefined) {
    return buildPolicy(DENY, event.methodArn)
  }

  try {
    const userId = await verifyToken(token)

    return buildPolicy(ALLOW, event.methodArn, userId)
  } catch {
    return buildPolicy(DENY, event.methodArn)
  }
}

export default authorizeChatSession

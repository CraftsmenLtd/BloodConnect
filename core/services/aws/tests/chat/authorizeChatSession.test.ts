import { generateKeyPairSync } from 'crypto'
import jwt from 'jsonwebtoken'
import type {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent
} from 'aws-lambda'
import authorizeChatSession from '../../chat/authorizeChatSession'

const USER_POOL_ID = 'us-east-1_test'
const CLIENT_ID = 'client-123'
const REGION = 'us-east-1'
const KID = 'test-kid'
const METHOD_ARN = 'arn:aws:execute-api:us-east-1:123456789012:abc/prod/$connect'
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`

const primary = generateKeyPairSync('rsa', { modulusLength: 2048 })
const foreign = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...primary.publicKey.export({ format: 'jwk' }), kid: KID }

const signToken = (claims: object, key = primary.privateKey): string =>
  jwt.sign(claims, key, { algorithm: 'RS256', keyid: KID })

const validClaims = {
  sub: 'donor1',
  token_use: 'access',
  client_id: CLIENT_ID,
  iss: ISSUER
}

const buildEvent = (
  headers: Record<string, string> | null,
  queryStringParameters: Record<string, string> | null = null
): APIGatewayRequestAuthorizerEvent =>
  ({
    type: 'REQUEST',
    methodArn: METHOD_ARN,
    headers,
    queryStringParameters
  } as unknown as APIGatewayRequestAuthorizerEvent)

const effectOf = (result: APIGatewayAuthorizerResult): string =>
  (result.policyDocument.Statement[0] as { Effect: string }).Effect

describe('authorizeChatSession', () => {
  beforeAll(() => {
    process.env.USER_POOL_ID = USER_POOL_ID
    process.env.USER_POOL_CLIENT_ID = CLIENT_ID
    process.env.AWS_REGION = REGION
  })

  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async() => ({ keys: [jwk] })
    }) as unknown as typeof fetch
  })

  it('allows a valid token from the Authorization header with the userId in context', async() => {
    const result = await authorizeChatSession(buildEvent({ Authorization: signToken(validClaims) }))

    expect(effectOf(result)).toBe('Allow')
    expect(result.context).toEqual({ userId: 'donor1' })
    expect((result.policyDocument.Statement[0] as { Resource: string }).Resource).toBe(METHOD_ARN)
  })

  it('accepts a Bearer-prefixed Authorization header', async() => {
    const result = await authorizeChatSession(
      buildEvent({ Authorization: `Bearer ${signToken(validClaims)}` })
    )

    expect(effectOf(result)).toBe('Allow')
    expect(result.context).toEqual({ userId: 'donor1' })
  })

  it('denies a token supplied only in the query string (never read, ADV-005)', async() => {
    const result = await authorizeChatSession(
      buildEvent(null, { Authorization: signToken(validClaims) })
    )

    expect(effectOf(result)).toBe('Deny')
    expect(result.context).toBeUndefined()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('denies when no token is present', async() => {
    const result = await authorizeChatSession(buildEvent({}))

    expect(effectOf(result)).toBe('Deny')
    expect(result.context).toBeUndefined()
  })

  it('denies a token signed by a key absent from the JWKS', async() => {
    const result = await authorizeChatSession(
      buildEvent({ Authorization: signToken(validClaims, foreign.privateKey) })
    )

    expect(effectOf(result)).toBe('Deny')
  })

  it('denies a token whose audience does not match the app client id', async() => {
    const result = await authorizeChatSession(
      buildEvent({ Authorization: signToken({ ...validClaims, client_id: 'other-client' }) })
    )

    expect(effectOf(result)).toBe('Deny')
  })

  it('denies a token with an unexpected token_use claim', async() => {
    const result = await authorizeChatSession(
      buildEvent({ Authorization: signToken({ ...validClaims, token_use: 'refresh' }) })
    )

    expect(effectOf(result)).toBe('Deny')
  })
})

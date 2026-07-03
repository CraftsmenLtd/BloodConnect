import type { APIGatewayRequestAuthorizerEvent } from 'aws-lambda'

const mockVerify = jest.fn()
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: () => ({ verify: mockVerify }) }
}))
jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() })
}))

import chatAuthorizer from '../../chat/chatAuthorizer'

const event = (token?: string): APIGatewayRequestAuthorizerEvent =>
  ({
    methodArn: 'arn:execute-api:region:acct:apiId/dev/$connect',
    queryStringParameters: token === undefined ? null : { token }
  }) as unknown as APIGatewayRequestAuthorizerEvent

describe('chatAuthorizer', () => {
  afterEach(() => jest.clearAllMocks())

  it('allows a valid token and exposes userId in the context', async () => {
    mockVerify.mockResolvedValue({ sub: 'user-1' })

    const result = await chatAuthorizer(event('good-token'))

    expect(result.principalId).toBe('user-1')
    expect(result.policyDocument.Statement[0].Effect).toBe('Allow')
    expect(result.context).toEqual({ userId: 'user-1' })
  })

  it('denies an invalid token', async () => {
    mockVerify.mockRejectedValue(new Error('invalid'))

    const result = await chatAuthorizer(event('bad-token'))

    expect(result.policyDocument.Statement[0].Effect).toBe('Deny')
  })

  it('denies when no token is supplied', async () => {
    const result = await chatAuthorizer(event())

    expect(result.policyDocument.Statement[0].Effect).toBe('Deny')
    expect(mockVerify).not.toHaveBeenCalled()
  })
})

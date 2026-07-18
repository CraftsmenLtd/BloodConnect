const mockPut = jest.fn()
const mockDeleteByConnectionId = jest.fn()
const mockVerify = jest.fn()

jest.mock('../../commons/ddbOperations/ChatConnectionDynamoDbOperations', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    put: mockPut,
    deleteByConnectionId: mockDeleteByConnectionId,
    queryByUserId: jest.fn()
  }))
}))

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: jest.fn(() => ({ verify: mockVerify })) }
}))

jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

import chatConnect from '../../chat/chatConnect'
import chatDisconnect from '../../chat/chatDisconnect'
import chatConnectAuthorizer from '../../chat/chatConnectAuthorizer'

describe('chatConnect', () => {
  beforeEach(() => jest.clearAllMocks())

  test('stores the connection carrying userId from the authorizer context', async() => {
    const result = await chatConnect({
      requestContext: { connectionId: 'conn-1', authorizer: { userId: 'user-1' } }
    })

    expect(result.statusCode).toBe(200)
    expect(mockPut).toHaveBeenCalledWith(
      expect.objectContaining({ connectionId: 'conn-1', userId: 'user-1' })
    )
  })

  test('stores multiple connections for the same user', async() => {
    await chatConnect({ requestContext: { connectionId: 'conn-1', authorizer: { userId: 'user-1' } } })
    await chatConnect({ requestContext: { connectionId: 'conn-2', authorizer: { userId: 'user-1' } } })

    expect(mockPut).toHaveBeenCalledTimes(2)
    expect(mockPut.mock.calls[0][0].connectionId).toBe('conn-1')
    expect(mockPut.mock.calls[1][0].connectionId).toBe('conn-2')
  })

  test('rejects with 401 when the authorizer context has no userId', async() => {
    const result = await chatConnect({ requestContext: { connectionId: 'conn-1', authorizer: {} } })

    expect(result.statusCode).toBe(401)
    expect(mockPut).not.toHaveBeenCalled()
  })
})

describe('chatDisconnect', () => {
  beforeEach(() => jest.clearAllMocks())

  test('deletes the connection using only the connectionId', async() => {
    const result = await chatDisconnect({ requestContext: { connectionId: 'conn-1' } })

    expect(result.statusCode).toBe(200)
    expect(mockDeleteByConnectionId).toHaveBeenCalledWith('conn-1')
  })
})

describe('chatConnectAuthorizer', () => {
  beforeEach(() => jest.clearAllMocks())

  test('returns an Allow policy with userId context for a valid token', async() => {
    mockVerify.mockResolvedValue({ sub: 'user-1' })

    const result = await chatConnectAuthorizer({
      methodArn: 'arn:aws:execute-api:region:acct:apiId/stage/$connect',
      queryStringParameters: { token: 'good-token' }
    })

    expect(result.policyDocument.Statement[0].Effect).toBe('Allow')
    expect(result.principalId).toBe('user-1')
    expect(result.context).toEqual({ userId: 'user-1' })
  })

  test('returns a Deny policy when verification fails', async() => {
    mockVerify.mockRejectedValue(new Error('invalid'))

    const result = await chatConnectAuthorizer({
      methodArn: 'arn:method',
      queryStringParameters: { token: 'bad-token' }
    })

    expect(result.policyDocument.Statement[0].Effect).toBe('Deny')
    expect(result.context).toBeUndefined()
  })

  test('returns a Deny policy when the token query param is missing', async() => {
    const result = await chatConnectAuthorizer({ methodArn: 'arn:method', queryStringParameters: null })

    expect(result.policyDocument.Statement[0].Effect).toBe('Deny')
    expect(mockVerify).not.toHaveBeenCalled()
  })
})

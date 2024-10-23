import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider'
import { updateCognitoUserInfo } from '../../../commons/cognito/CognitoOperations'
import { mockClient } from 'aws-sdk-client-mock'
import { mockUpdateCognitoAttributes } from '../../../../../application/tests/mocks/mockCognitoUserData'

describe('CognitoOperations Tests', () => {
  const cognitoMock = mockClient(CognitoIdentityProviderClient)

  beforeEach(() => {
    cognitoMock.reset()
    process.env.AWS_REGION = 'us-east-1'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should update user attributes in Cognito successfully', async() => {
    const mockResponse = { $metadata: { httpStatusCode: 200 } }

    cognitoMock.on(AdminUpdateUserAttributesCommand).resolves(mockResponse)
    await updateCognitoUserInfo(mockUpdateCognitoAttributes)

    const returnValue = await cognitoMock.calls()[0].returnValue
    expect(cognitoMock.calls()).toHaveLength(1)
    expect(cognitoMock.calls()[0].args[0]).toBeInstanceOf(AdminUpdateUserAttributesCommand)
    expect(returnValue).toEqual(mockResponse)
  })

  test('should throw an error when Cognito fails to update attributes', async() => {
    cognitoMock.on(AdminUpdateUserAttributesCommand).rejects(new Error('Cognito update failed'))

    await expect(
      updateCognitoUserInfo(mockUpdateCognitoAttributes)
    ).rejects.toThrow('Failed to update user attributes in Cognito: Cognito update failed')

    expect(cognitoMock.calls()).toHaveLength(1)
  })
})

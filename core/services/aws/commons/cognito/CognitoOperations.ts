import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand
} from '@aws-sdk/client-cognito-identity-provider'
import type { UpdateCognitoAttributes } from '../../../../application/models/cognito/CognitoModel'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../../commons/libs/constants/ApiResponseMessages'

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
})

export async function updateCognitoUserInfo({
  userPoolId,
  username,
  attributes
}: UpdateCognitoAttributes): Promise<void> {
  const userAttributes = Object.keys(attributes).map((key) => ({
    Name: key,
    Value: attributes[key].toString()
  }))

  const updateParams = {
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: userAttributes
  }

  try {
    const command = new AdminUpdateUserAttributesCommand(updateParams)
    await cognitoClient.send(command)
  } catch (error) {
    const errorMessage
      = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    throw new Error(
      `Failed to update user attributes in Cognito: ${errorMessage}`
    )
  }
}

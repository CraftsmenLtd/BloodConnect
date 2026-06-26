import type {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult
} from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  GetUserCommand
} from '@aws-sdk/client-cognito-identity-provider'
import { Config } from '../../../../commons/libs/config/config'

const config = new Config<{ awsRegion: string }>().getConfig()
const cognitoClient = new CognitoIdentityProviderClient({ region: config.awsRegion })

const buildPolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context: Record<string, string> = {}
): APIGatewayAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }
    ]
  },
  context
})

async function chatAuthorizer(
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  const token = event.queryStringParameters?.token ?? ''
  if (token === '') {
    throw new Error('Unauthorized')
  }

  try {
    const user = await cognitoClient.send(new GetUserCommand({ AccessToken: token }))
    const attribute = (name: string): string | undefined =>
      user.UserAttributes?.find((item) => item.Name === name)?.Value
    const userId = attribute('custom:userId') ?? attribute('sub') ?? user.Username ?? ''

    if (userId === '') {
      throw new Error('Unauthorized')
    }

    return buildPolicy(userId, 'Allow', event.methodArn, { userId })
  } catch {
    throw new Error('Unauthorized')
  }
}

export default chatAuthorizer

import type {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult
} from 'aws-lambda'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { createServiceLogger } from '../commons/logger/ServiceLogger'

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID ?? ''
})

const buildPolicy = (
  effect: 'Allow' | 'Deny',
  userId: string,
  resource: string
): APIGatewayAuthorizerResult => ({
  principalId: userId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [{ Action: 'execute-api:Invoke', Effect: effect, Resource: resource }]
  },
  context: { userId }
})

async function chatAuthorizer(
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  const logger = createServiceLogger('chatAuthorizer')
  const token = event.queryStringParameters?.token

  try {
    if (token === undefined || token === '') {
      throw new Error('Missing token')
    }
    const payload = await verifier.verify(token)

    return buildPolicy('Allow', payload.sub, event.methodArn)
  } catch (error) {
    logger.error({ error }, 'websocket authorization failed')

    return buildPolicy('Deny', 'unauthorized', event.methodArn)
  }
}

export default chatAuthorizer

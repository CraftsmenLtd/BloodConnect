import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda'
import { executionEnv } from '@application/authWorkflows/authToken/constants'
import validateToken from '@application/authWorkflows/authToken/tokenValidator'
import { getBearerAuthToken } from '@application/authWorkflows/authWorkflowUseCases'
import InvalidTokenError from '@application/authWorkflows/errors/InvalidTokenError'
import appLogger from '@commons/libs/logger/ApplicationLogger'

/**
 * Authorizer lambda for ApiGateway. Validates the token from "Bearer token".
 * Returns Unauthorized 401 for invalid token
 */
function tokenValidatorLambda(event: APIGatewayTokenAuthorizerEvent): APIGatewayAuthorizerResult | 'Unauthorized' {
  const token = getBearerAuthToken(event.authorizationToken)
  if (token !== undefined) {
    try {
      return {
        principalId: 'user',
        context: validateToken(token) as APIGatewayAuthorizerResult['context'],
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Allow',
              Resource: event.methodArn
            }
          ]
        }
      }
    } catch (err) {
      appLogger(executionEnv).info('Token validation error', (err as InvalidTokenError).message)
    }
  }
  return 'Unauthorized'
}

export default tokenValidatorLambda

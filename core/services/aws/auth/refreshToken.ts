import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { executionEnv } from '@application/authWorkflows/authToken/constants'
import validateToken from '@application/authWorkflows/authToken/tokenValidator'
import InvalidTokenError from '@application/authWorkflows/errors/InvalidTokenError'
import appLogger from '@commons/libs/logger/ApplicationLogger'
import { HttpCodes } from '@commons/libs/constants/GenericCodes'
import { getAuthToken } from '@application/authWorkflows/authWorkflowUseCases'
import generateApiGatewayResponse from 'core/services/aws/commons/lambda/ApiGateway'

function refreshTokenLambda(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  const token = event.headers.refreshToken
  if (token !== undefined) {
    try {
      const refreshTokenPayload = validateToken(token)
      // TODO: needs to be checked in the database
      return generateApiGatewayResponse(getAuthToken(refreshTokenPayload), HttpCodes.ok)
    } catch (err) {
      appLogger(executionEnv).info('Refresh token validation error', (err as InvalidTokenError).message)
    }
  }
  return generateApiGatewayResponse('Unauthorized', HttpCodes.unauthorized)
}

export default refreshTokenLambda

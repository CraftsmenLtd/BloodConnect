import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { HttpCodes } from '@commons/libs/constants/GenericCodes'
import { getAuthTokenFromRefreshToken } from '@application/authWorkflows/authWorkflowUseCases'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'

/**
 * Lambda associated with HTTP endpoint to refresh auth token. Seeks the refresh token in the request header with key refreshToken
 * Returns a new auth token for a valid refresh token. Returns Unauthorized 401 otherwise.
 */
function refreshTokenLambda(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  const authToken = getAuthTokenFromRefreshToken(event.headers.refreshToken)
  if (authToken !== undefined) {
    return generateApiGatewayResponse(authToken, HttpCodes.ok)
  }
  return generateApiGatewayResponse('Unauthorized', HttpCodes.unauthorized)
}

export default refreshTokenLambda

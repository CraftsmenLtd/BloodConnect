import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { HTTP_CODES } from '@commons/libs/constants/GenericCodes'

async function donorRequestRouter(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return generateApiGatewayResponse({
    message: 'Hello, World!',
    data: event
  }, HTTP_CODES.OK)
}

export default donorRequestRouter

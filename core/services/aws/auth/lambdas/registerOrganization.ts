import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

async function RegisterOrganizationLambda(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello, World!',
      data: event
    })
  }

  return response
}

export default RegisterOrganizationLambda

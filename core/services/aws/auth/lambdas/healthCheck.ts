import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

async function healthCheck(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Health is ok!',
      data: event
    })
  }

  return response
}

export default healthCheck

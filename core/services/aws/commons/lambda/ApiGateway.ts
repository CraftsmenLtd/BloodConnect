import type { APIGatewayProxyResult } from 'aws-lambda'

export default function generateApiGatewayResponse(
  body: string | object,
  statusCode: number,
  headers?: APIGatewayProxyResult['headers']
): APIGatewayProxyResult {
  return { body: typeof body === 'string' ? body : JSON.stringify(body), statusCode, headers }
}

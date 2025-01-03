import { APIGatewayProxyResult } from 'aws-lambda'

export default function generateApiGatewayResponse(
  body: string | object,
  statusCode: number,
  headers?: APIGatewayProxyResult['headers']
): APIGatewayProxyResult {
  return { body: typeof body === 'string' ? body : JSON.stringify(body), statusCode, headers }
}

export function generateApiResponse({
  success,
  data,
  message,
  statusCode,
  error,
  headers
}: {
  success: boolean;
  message: string;
  statusCode: number;
  data?: object | null;
  error?: object | null;
  headers?: APIGatewayProxyResult['headers'];
}): APIGatewayProxyResult {
  const responseBody = {
    success,
    message,
    data,
    error
  }
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(responseBody)
  }
}

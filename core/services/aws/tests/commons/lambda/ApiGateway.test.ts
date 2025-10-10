import type { APIGatewayProxyResult } from 'aws-lambda'
import generateApiGatewayResponse from '../../../commons/lambda/ApiGateway'

describe('generateApiGatewayResponse', () => {
  it('should return a valid APIGatewayProxyResult with a string body', () => {
    const body = 'Success'
    const statusCode = 200
    const expectedResponse: APIGatewayProxyResult = {
      body,
      statusCode,
      headers: undefined
    }

    const result = generateApiGatewayResponse(body, statusCode)
    expect(result).toEqual(expectedResponse)
  })

  it('should return a valid APIGatewayProxyResult with an object body as a JSON string', () => {
    const body = { message: 'Success' }
    const statusCode = 200
    const expectedResponse: APIGatewayProxyResult = {
      body: JSON.stringify(body),
      statusCode,
      headers: undefined
    }

    const result = generateApiGatewayResponse(body, statusCode)
    expect(result).toEqual(expectedResponse)
  })

  it('should return a valid APIGatewayProxyResult with custom headers', () => {
    const body = { message: 'Created' }
    const statusCode = 201
    const headers = { 'Content-Type': 'application/json' }
    const expectedResponse: APIGatewayProxyResult = {
      body: JSON.stringify(body),
      statusCode,
      headers
    }

    const result = generateApiGatewayResponse(body, statusCode, headers)
    expect(result).toEqual(expectedResponse)
  })
})

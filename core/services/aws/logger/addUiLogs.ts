import type { APIGatewayProxyResult } from 'aws-lambda'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import type { ServiceLoggerAttributes } from '../commons/logger/ServiceLogger'
import { createServiceLogger } from '../commons/logger/ServiceLogger'

export type LoggerAttributes = {
  userId: string;
  log: object;
}
async function addLoggerLambda(
  event: LoggerAttributes & ServiceLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const lambdaLogger = createServiceLogger(event.userId)
  lambdaLogger.info(event.log)

  return generateApiGatewayResponse(
    { message: 'Log added successfully', success: true },
    HTTP_CODES.OK
  )
}

export default addLoggerLambda

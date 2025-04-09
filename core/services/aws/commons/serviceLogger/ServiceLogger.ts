import type { Logger } from '../../../../application/models/logger/Logger'
import { JsonLogger } from '../../../../../commons/libs/logger/JsonLogger'

export const createServiceLogger = (
  awsRequestId: string
): Logger => {
  return JsonLogger.child({
    awsRequestId
  })
}

export type ServiceLoggerAttributes = {
  awsRequestId: string;
}

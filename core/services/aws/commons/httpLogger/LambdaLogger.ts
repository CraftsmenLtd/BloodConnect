import { Logger } from '../../../../application/models/logger/Logger'
import { JsonLogger } from '../../../../../commons/libs/logger/JsonLogger'

export const createLambdaLogger = (
  userId: string
): Logger => {
  return JsonLogger.child({
    userId
  })
}

export type LambdaLoggerAttributes = {
  userId: string;
}

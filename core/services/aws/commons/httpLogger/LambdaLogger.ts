import { Logger } from '../../../../application/models/logger/Logger'
import { JsonLogger } from '../../../../../commons/libs/logger/JsonLogger'

export const createLambdaLogger = (
  userId: string
): Logger => {
  const { info, error, warn, debug } = JsonLogger.child({
    userId
  })
  return { info, error, warn, debug }
}

export type LambdaLoggerAttributes = {
  userId: string;
}

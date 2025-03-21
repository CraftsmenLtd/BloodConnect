import { Logger } from '../../../../application/models/logger/Logger'
import { JsonLogger } from '../../../../../commons/libs/logger/JsonLogger'

export const createServiceLogger = (
  userId: string,
  extraArgs: Record<string, any> = {}
): Logger => {
  return JsonLogger.child({
    userId,
    ...extraArgs
  })
}

export type ServiceLoggerAttributes = {
  userId: string;
  [key: string]: any;
}

import type { Logger } from '../../../../application/models/logger/Logger'
import { JsonLogger } from '../../../../../commons/libs/logger/JsonLogger'

export const createHTTPLogger = (
  userId: string,
  apiGwRequestId: string,
  cloudFrontRequestId: string,
  extraArgs: Record<string, unknown> = {}
): Logger => {
  return JsonLogger.child({
    userId,
    apiGwRequestId,
    cloudFrontRequestId,
    ...extraArgs
  }) as Logger
}

export type HttpLoggerAttributes = {
  userId: string;
  apiGwRequestId: string;
  cloudFrontRequestId: string;
}

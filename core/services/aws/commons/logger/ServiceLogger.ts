import type { Logger } from '../../../../application/models/logger/Logger'
import { JsonLogger } from '../../../../../commons/libs/logger/JsonLogger'

export const createServiceLogger = (
  userId: string,
  extraArgs: Record<string, unknown> = {}
): Logger => JsonLogger.child({
  userId,
  ...extraArgs
}) as Logger

export type ServiceLoggerAttributes = {
  userId: string;
  [key: string]: unknown;
}

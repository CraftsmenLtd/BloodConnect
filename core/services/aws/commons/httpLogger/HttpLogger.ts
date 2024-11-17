import { Logger } from "../../../../application/models2/logger/Logger";
import { JsonLogger } from "../../../../../commons/libs/logger/JsonLogger";

export const createHTTPLogger = (
  userId: string,
  apiGwRequestId: string,
  cloudFrontRequestId: string
): Logger => {
  const { info, error, warn, debug } = JsonLogger.child({
    userId,
    apiGwRequestId,
    cloudFrontRequestId,
  });
  return { info, error, warn, debug };
};

export type HttpLoggerAttributes = {
  userId: string;
  apiGwRequestId: string;
  cloudFrontRequestId: string;
};

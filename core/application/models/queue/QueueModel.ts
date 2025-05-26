import type { DTO } from '../../../../commons/dto/DTOCommon'

export type QueueModel = {
  queue(message: DTO, queue_url: string, delaySeconds?: number): Promise<void>;
  updateVisibilityTimeout(
    receiptHandle: string,
    queueUrl: string,
    visibilityTimeout: number
  ): Promise<void>;
}

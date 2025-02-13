import { DTO } from '../../../../commons/dto/DTOCommon'

export interface QueueModel {
  queue(message: DTO, queue_url: string, delaySeconds?: number): Promise<void>;
  updateVisibilityTimeout(
    receiptHandle: string,
    queue_url: string,
    VisibilityTimeout: number
  ): Promise<void>;
}

import { DTO } from '../../../../commons/dto/DTOCommon';
// import { NotificationQueueMessage } from '../../../../commons/dto/NotificationDTO';

export interface SQSModel {
  queue(message: DTO, queueUrl: string): Promise<void>;
}

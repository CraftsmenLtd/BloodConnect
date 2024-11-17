import { DTO } from '../../../../commons/dto/DTOCommon'

export interface QueueModel {
  queue(notification: DTO, snsEndpointArn: string): Promise<void>;
}

import { DTO } from '../../../../commons/dto/DTOCommon'

export interface SQSModel {
  queue(notification: DTO, snsEndpointArn: string): Promise<void>;
}

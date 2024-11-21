import { DTO } from '../../../../commons/dto/DTOCommon'

export interface QueueModel {
  queue(message: DTO): Promise<void>;
}

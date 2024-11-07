import { DTO } from '../../../../commons/dto/DTOCommon'

export interface SQSModel {
  queue(message: DTO, queueUrl: string): Promise<void>;
}

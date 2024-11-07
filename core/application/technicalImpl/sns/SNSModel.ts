import { DTO } from '../../../../commons/dto/DTOCommon'

export interface SNSModel {
  publish(message: DTO): Promise<void>;
}

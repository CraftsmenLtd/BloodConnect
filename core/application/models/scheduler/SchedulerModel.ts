import type { DTO } from '../../../../commons/dto/DTOCommon'

export type SchedulerModel = {
  schedule(message: DTO, lambda_arn: string, delaySeconds?: number): Promise<void>;
}

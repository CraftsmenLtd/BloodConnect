import { SnsRegistrationAttributes } from '../../notificationWorkflow/Types'
import { DTO } from '../../../../commons/dto/DTOCommon'

export interface SNSModel {
  publish(message: DTO): Promise<void>;
  createPlatformEndpoint(attributes: SnsRegistrationAttributes): Promise<{ endpointArn: string }>;
}

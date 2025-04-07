import type { SnsRegistrationAttributes } from '../../notificationWorkflow/Types'
import type { DTO } from '../../../../commons/dto/DTOCommon'

export type SNSModel = {
  publish(message: DTO, snsEndpointArn: string): Promise<void>;
  createPlatformEndpoint(attributes: SnsRegistrationAttributes): Promise<{ snsEndpointArn: string }>;
  getEndpointAttributes(existingArn: string): Promise<Record<string, string>>;
  setEndpointAttributes(existingArn: string, attributes: SnsRegistrationAttributes): Promise<void>;
}

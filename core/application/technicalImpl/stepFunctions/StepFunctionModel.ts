import { StepFunctionExecutionAttributes } from '../../bloodDonationWorkflow/Types'
import { StepFunctionInput } from '../../../../commons/dto/DonationDTO'

export interface StepFunctionModel {
  startExecution(input: StepFunctionInput): Promise<StepFunctionExecutionAttributes>;
}

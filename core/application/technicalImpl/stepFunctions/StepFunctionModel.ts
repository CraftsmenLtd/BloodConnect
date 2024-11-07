import { StepFunctionExecutionAttributes, StepFunctionInput } from '../../bloodDonationWorkflow/Types'

export interface StepFunctionModel {
  startExecution(input: StepFunctionInput, executionName?: string): Promise<StepFunctionExecutionAttributes>;
}

import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn'
import { StepFunctionInput, StepFunctionExecutionAttributes } from '../../../../application/bloodDonationWorkflow/Types'
import { GENERIC_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { StepFunctionModel } from '../../../../application/technicalImpl/stepFunctions/StepFunctionModel'

export default class StepFunctionOperations implements StepFunctionModel {
  private readonly client: SFNClient

  constructor() {
    this.client = new SFNClient({ region: process.env.AWS_REGION })
  }

  async startExecution(input: StepFunctionInput): Promise<StepFunctionExecutionAttributes> {
    const command = new StartExecutionCommand({
      stateMachineArn: process.env.STEP_FUNCTION_ARN,
      input: JSON.stringify(input)
    })

    try {
      const response = await this.client.send(command)
      if (response.executionArn == null) {
        throw new Error('Failed to start Step Function execution. Execution ARN is undefined.')
      }

      return {
        executionArn: response.executionArn,
        status: 'RUNNING',
        startDate: new Date().toISOString(),
        input
      }
    } catch (error) {
      throw new Error(`Step Function execution: ${error} ` + GENERIC_CODES.ERROR)
    }
  }
}

import { mockClient } from 'aws-sdk-client-mock'
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn'
import StepFunctionOperations from '../../../commons/stepFunction/StepFunctionOperations'
import { startExecutionInputMock, startExecutionOutputMock } from '../../../../../application/tests/mocks/mockStepfunctionInput'

describe('StepFunctionOperations Tests', () => {
  const sfnMock = mockClient(SFNClient)
  const stepFunctionOperations = new StepFunctionOperations()

  beforeEach(() => {
    sfnMock.reset()
    process.env.STEP_FUNCTION_ARN = 'arn:aws:states:us-east-1:123456789012:stateMachine:TestStateMachine'
    process.env.AWS_REGION = 'us-east-1'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should start Step Function execution successfully', async() => {
    const mockResponse = { executionArn: 'arn:aws:states:us-east-1:123456789012:execution:TestExecution' }
    sfnMock.on(StartExecutionCommand).resolves(mockResponse)

    const result = await stepFunctionOperations.startExecution(startExecutionInputMock)

    expect(result.executionArn).toEqual(mockResponse.executionArn)
    expect(result.status).toEqual(startExecutionOutputMock.status)
    expect(result.input).toEqual(startExecutionInputMock)
    expect(sfnMock.calls()).toHaveLength(1)
  })

  test('should throw an error when executionArn is undefined', async() => {
    const mockResponse = { executionArn: undefined }
    sfnMock.on(StartExecutionCommand).resolves(mockResponse)

    await expect(stepFunctionOperations.startExecution(startExecutionInputMock)).rejects.toThrow(
      'Failed to start Step Function execution. Execution ARN is undefined.'
    )

    expect(sfnMock.calls()).toHaveLength(1)
  })

  test('should throw error when Step Function execution fails', async() => {
    sfnMock.on(StartExecutionCommand).rejects(new Error('Step Function error'))

    await expect(stepFunctionOperations.startExecution(startExecutionInputMock)).rejects.toThrow(
      'Step Function execution: Error: Step Function error 500'
    )

    expect(sfnMock.calls()).toHaveLength(1)
  })
})

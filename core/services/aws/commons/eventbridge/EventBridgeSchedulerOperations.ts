import {
  SchedulerClient,
  CreateScheduleCommand,
  type CreateScheduleCommandInput,
  FlexibleTimeWindowMode
} from '@aws-sdk/client-scheduler'
import { generateUniqueID } from '../../../../application/utils/idGenerator'
import type { TaskScheduleConfig } from '../../../../application/schedulerWorkflow/Types'
import type { SchedulerModel } from '../../../../application/models/scheduler/SchedulerModel'

export default class EventBridgeSchedulerOperations implements SchedulerModel {
  private readonly schedulerClient: SchedulerClient

  constructor(
    private readonly scheduleGroupName: string,
    private readonly scheduleRoleArn: string,
    region: string
  ) {
    this.schedulerClient = new SchedulerClient({ region })
  }

  async scheduleTask(taskConfig: TaskScheduleConfig): Promise<string> {
    const scheduleId = `${taskConfig.taskType.toLowerCase()}-${generateUniqueID()}`

    const scheduleExpression = `at(${taskConfig.scheduleAt.toISOString()})`

    const createScheduleInput: CreateScheduleCommandInput = {
      Name: scheduleId,
      GroupName: this.scheduleGroupName,
      ScheduleExpression: scheduleExpression,
      Target: {
        Arn: taskConfig.targetLambdaArn,
        RoleArn: this.scheduleRoleArn,
        Input: JSON.stringify(taskConfig.payload)
      },
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF
      },
      ActionAfterCompletion: 'DELETE'
    }

    await this.schedulerClient.send(new CreateScheduleCommand(createScheduleInput))

    return scheduleId
  }
}
import { SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand } from '@aws-sdk/client-scheduler'
import type { DTO } from 'commons/dto/DTOCommon'
import { randomUUID } from 'crypto'
import type { SchedulerModel } from 'core/application/models/scheduler/SchedulerModel'

export default class SchedulerOperations implements SchedulerModel {
  private readonly client: SchedulerClient
  private readonly roleArn: string

  constructor(region: string, roleArn: string) {
    this.client = new SchedulerClient({ region })
    this.roleArn = roleArn
  }

  async schedule(messageBody: DTO, lambdaArn: string, delaySeconds?: number): Promise<void> {
    const scheduleName = `schedule-${randomUUID()}`
    const scheduleTime = new Date()

    if (delaySeconds !== undefined && delaySeconds > 0) {
      scheduleTime.setSeconds(scheduleTime.getSeconds() + delaySeconds)
    }

    await this.client.send(
      new CreateScheduleCommand({
        Name: scheduleName,
        ScheduleExpression: `at(${scheduleTime.toISOString().slice(0, 19)})`,
        FlexibleTimeWindow: {
          Mode: 'OFF'
        },
        Target: {
          Arn: lambdaArn,
          RoleArn: this.roleArn,
          Input: JSON.stringify(messageBody)
        },
        ActionAfterCompletion: 'DELETE'
      })
    )
  }

  async deleteSchedule(scheduleName: string): Promise<void> {
    await this.client.send(
      new DeleteScheduleCommand({
        Name: scheduleName
      })
    )
  }
}
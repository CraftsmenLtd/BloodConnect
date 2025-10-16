import { SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand } from '@aws-sdk/client-scheduler'
import type { DTO } from 'commons/dto/DTOCommon'
import { randomUUID } from 'crypto'
import type { SchedulerModel } from 'core/application/models/scheduler/SchedulerModel'
import type { Logger } from 'core/application/models/logger/Logger'

type ScheduleMessageBody = DTO & {
  targetedExecutionTime?: string
}

export default class SchedulerOperations implements SchedulerModel {
  private readonly client: SchedulerClient
  private readonly roleArn: string
  protected readonly logger: Logger
  private readonly defaultDelayInSeconds?: number

  constructor(region: string, roleArn: string, logger: Logger, defaultDelayInSeconds?: number) {
    this.client = new SchedulerClient({ region })
    this.roleArn = roleArn
    this.logger = logger
    this.defaultDelayInSeconds = defaultDelayInSeconds ?? 60
  }

  private toISOStringWithoutMilliseconds(date: Date): string {
    return date.toISOString().split('.')[0]
  }

  async schedule(messageBody: ScheduleMessageBody, lambdaArn: string): Promise<void> {
    const scheduleName = `schedule-${randomUUID()}`
    const currentTime = new Date()

    const minimumTime = this.defaultDelayInSeconds
      ? new Date(currentTime.getTime() + this.defaultDelayInSeconds * 1000)
      : currentTime

    const targetTime = messageBody.targetedExecutionTime ? new Date(messageBody.targetedExecutionTime) : null
    const scheduleTime = targetTime && targetTime > minimumTime ? targetTime : minimumTime

    try {
      await this.client.send(
        new CreateScheduleCommand({
          Name: scheduleName,
          ScheduleExpression: `at(${this.toISOStringWithoutMilliseconds(scheduleTime)})`,
          FlexibleTimeWindow: { Mode: 'OFF' },
          Target: {
            Arn: lambdaArn,
            RoleArn: this.roleArn,
            Input: JSON.stringify(messageBody),
          },
          ActionAfterCompletion: 'DELETE',
        })
      )
    } catch (error) {
      this.logger.error('Error creating schedule:', error)
      throw error
    }
  }

  async deleteSchedule(scheduleName: string): Promise<void> {
    await this.client.send(
      new DeleteScheduleCommand({
        Name: scheduleName
      })
    )
  }
}
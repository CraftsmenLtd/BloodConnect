import { SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand } from '@aws-sdk/client-scheduler'
import type { DTO } from 'commons/dto/DTOCommon'
import { randomUUID } from 'crypto'
import type { SchedulerModel } from 'core/application/models/scheduler/SchedulerModel'
import type { Logger } from 'core/application/models/logger/Logger'

export default class SchedulerOperations implements SchedulerModel {
  private readonly client: SchedulerClient
  private readonly roleArn: string
  protected readonly logger: Logger

  constructor(region: string, roleArn: string, logger: Logger) {
    this.client = new SchedulerClient({ region })
    this.roleArn = roleArn
    this.logger = logger
  }

  private toISOStringWithoutMilliseconds(date: Date): string {
    return date.toISOString().split('.')[0]
  }

  async schedule(messageBody: DTO, lambdaArn: string, delaySeconds?: number): Promise<void> {
    const scheduleName = `schedule-${randomUUID()}`
    const scheduleTime = new Date()

    const MIN_DELAY_SECONDS = 80
    if (delaySeconds === undefined || delaySeconds < MIN_DELAY_SECONDS) {
      delaySeconds = MIN_DELAY_SECONDS
    }

    scheduleTime.setSeconds(scheduleTime.getSeconds() + delaySeconds)

    try {
      const result = await this.client.send(
        new CreateScheduleCommand({
          Name: scheduleName,
          ScheduleExpression: `at(${this.toISOStringWithoutMilliseconds(scheduleTime)})`,
          FlexibleTimeWindow: { Mode: 'OFF' },
          Target: {
            Arn: lambdaArn,
            RoleArn: this.roleArn,
            Input: JSON.stringify(messageBody),
          },
          ActionAfterCompletion: 'NONE',
        })
      )
      this.logger.info('Schedule created successfully', { result })
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
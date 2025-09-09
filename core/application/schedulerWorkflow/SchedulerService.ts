import type { Logger } from '../models/logger/Logger'
import type { SchedulerModel } from '../models/scheduler/SchedulerModel'
import type { TaskScheduleConfig, SchedulerConfig } from './Types'
import SchedulerOperationError from './SchedulerOperationError'

export class SchedulerService {
  constructor(
    protected readonly schedulerModel: SchedulerModel,
    protected readonly logger: Logger,
    protected readonly config: SchedulerConfig
  ) {}

  async scheduleTask(taskConfig: TaskScheduleConfig): Promise<string> {
    try {
      this.logger.info('scheduling task', {
        taskType: taskConfig.taskType,
        scheduleAt: taskConfig.scheduleAt.toISOString()
      })

      const scheduleId = await this.schedulerModel.scheduleTask(taskConfig)

      this.logger.info('task scheduled successfully', { scheduleId })

      return scheduleId
    } catch (error) {
      this.logger.error('failed to schedule task', { error })
      throw new SchedulerOperationError('Failed to schedule task')
    }
  }
}
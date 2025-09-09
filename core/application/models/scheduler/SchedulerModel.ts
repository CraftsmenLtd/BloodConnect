import type { TaskScheduleConfig } from '../../schedulerWorkflow/Types'

export type SchedulerModel = {
  scheduleTask(taskConfig: TaskScheduleConfig): Promise<string>;
}
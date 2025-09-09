export enum TaskType {
  DONOR_SEARCH = 'DONOR_SEARCH'
}

export type TaskScheduleConfig = {
  taskType: TaskType;
  payload: Record<string, unknown>;
  scheduleAt: Date;
  targetLambdaArn: string;
}

export type SchedulerConfig = {
  scheduleGroupName: string;
  scheduleRoleArn: string;
}
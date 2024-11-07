export interface NotificationAttributes {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationQueueMessage {
  userId: string;
  deviceToken: string;
  payload: NotificationPayload;
}

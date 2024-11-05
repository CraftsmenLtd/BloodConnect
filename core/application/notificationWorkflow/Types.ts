export interface NotificationAttributes {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

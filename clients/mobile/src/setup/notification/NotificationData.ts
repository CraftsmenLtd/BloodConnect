// export interface NotificationData {
//   patientName: string;
//   neededBloodGroup: string;
//   bloodQuantity: number;
//   urgencyLevel: string;
//   location: string;
//   donationDateTime: string;
//   contactNumber: string;
//   transportationInfo: string;
//   shortDescription: string;
//   requestPostId: string;
//   seekerId: string;
//   createdAt: string;
// }

export type NotificationData = Record<string, unknown> | null

export type NotificationDataTypes = {
  notificationData: Record<string, unknown> | null;
}

export const initialNotificationState: NotificationDataTypes = {
  notificationData: null
}

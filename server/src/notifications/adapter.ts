export interface NotificationPayload {
  to: string; // phone or email
  recipientName: string;
  subject?: string;
  message: string;
  serviceType?: string;
  vehicleReg: string;
  reminderType: 'SERVICE' | 'INSURANCE' | 'PUC' | 'WARRANTY';
  dueDate: string;
  bookingUrl: string;
}

export interface NotificationResult {
  success: boolean;
  error?: string;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

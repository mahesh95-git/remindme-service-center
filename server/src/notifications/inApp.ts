import { logger } from '../utils/logger.js';
import { NotificationPayload, NotificationProvider, NotificationResult } from './adapter.js';

export class InAppProvider implements NotificationProvider {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    logger.info(`[InApp Provider] In-app notification prepared for vehicle ${payload.vehicleReg}: ${payload.reminderType} due ${payload.dueDate}`);
    return { success: true };
  }
}

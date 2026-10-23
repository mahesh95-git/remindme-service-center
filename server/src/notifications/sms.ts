import { logger } from '../utils/logger.js';
import { NotificationPayload, NotificationProvider, NotificationResult } from './adapter.js';

export class SmsProvider implements NotificationProvider {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // TODO: Integrate Twilio or SMS Gateway (e.g. AWS SNS, Fast2SMS) using credentials from environment variables
    logger.info(`[SMS Provider MOCK] Sent SMS to ${payload.to}: "${payload.message} Book slot: ${payload.bookingUrl}"`);
    return { success: true };
  }
}

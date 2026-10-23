import { logger } from '../utils/logger.js';
import { NotificationPayload, NotificationProvider, NotificationResult } from './adapter.js';

export class WhatsAppProvider implements NotificationProvider {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // TODO: Integrate WhatsApp Cloud API / Meta Graph API using WA_TOKEN & PHONE_NUMBER_ID
    logger.info(`[WhatsApp Provider MOCK] Sent WhatsApp message to ${payload.to}: "${payload.message} Direct booking: ${payload.bookingUrl}"`);
    return { success: true };
  }
}

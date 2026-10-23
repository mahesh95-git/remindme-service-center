import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { NotificationPayload, NotificationProvider, NotificationResult } from './adapter.js';

export class EmailProvider implements NotificationProvider {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (ENV.SMTP_HOST && ENV.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_PORT === 465,
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        },
      });
    } else {
      logger.warn('[EmailProvider] SMTP is not configured. Reminder emails will be logged as mock sends.');
    }
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const subject = payload.subject || `RemindMe Reminder: ${payload.reminderType} Due for ${payload.vehicleReg}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #2563eb;">RemindMe Service Reminder</h2>
        <p>Dear <strong>${payload.recipientName}</strong>,</p>
        <p>${payload.message}</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${payload.vehicleReg}</p>
          <p style="margin: 5px 0;"><strong>Service Type:</strong> ${payload.serviceType || payload.reminderType}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${payload.dueDate}</p>
        </div>
        <p>Book your service slot conveniently online:</p>
        <a href="${payload.bookingUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Book Service Slot</a>
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">If you have already serviced your vehicle, please disregard this notice.</p>
      </div>
    `;

    try {
      if (!this.transporter) {
        return { success: false, error: 'SMTP is not configured.' };
      }

      const result = await this.transporter.sendMail({
        from: ENV.SMTP_FROM,
        to: payload.to,
        subject,
        html,
      });
      logger.info(
        `[EmailProvider] SMTP accepted email for ${payload.to}. Message ID: ${result.messageId}. ` +
        `Accepted: ${result.accepted.join(', ') || 'none'}. Rejected: ${result.rejected.join(', ') || 'none'}.`
      );
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown email provider error';
      logger.error(`[EmailProvider] Failed to send email to ${payload.to}`, err);
      return { success: false, error: message };
    }
  }
}

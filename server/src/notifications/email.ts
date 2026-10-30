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

  async sendServiceCompletion(input: {
    to: string; recipientName: string; serviceType: string; vehicleName: string;
    vehicleReg: string; invoicePhotoUrl: string | null; invoiceTotal: string | null;
  }): Promise<NotificationResult> {
    if (!this.transporter) return { success: false, error: 'SMTP is not configured.' };
    const invoice = input.invoicePhotoUrl
      ? `<p><a href="${input.invoicePhotoUrl}">View your invoice photo</a>${input.invoiceTotal ? ` · Total: ₹${input.invoiceTotal}` : ''}</p>`
      : '';
    try {
      const result = await this.transporter.sendMail({
        from: ENV.SMTP_FROM,
        to: input.to,
        subject: `Service completed: ${input.vehicleReg}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#1e293b"><h2>Your vehicle service is complete</h2><p>Hello ${input.recipientName},</p><p>${input.serviceType} for your ${input.vehicleName} (${input.vehicleReg}) has been completed.</p>${invoice}<p>Thank you for choosing our service center.</p></div>`,
      });
      logger.info(`[EmailProvider] Service completion email accepted for ${input.to}. Message ID: ${result.messageId}.`);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown email provider error';
      logger.error(`[EmailProvider] Failed to send service completion email to ${input.to}`, err);
      return { success: false, error: message };
    }
  }

  async sendPasswordReset(to: string, recipientName: string, resetUrl: string): Promise<NotificationResult> {
    try {
      if (!this.transporter) {
        const error = 'SMTP is not configured.';
        logger.error(`[EmailProvider] Cannot send password reset email to ${to}: ${error}`);
        return { success: false, error };
      }

      const result = await this.transporter.sendMail({
        from: ENV.SMTP_FROM,
        to,
        subject: 'Reset your RemindMe password',
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Reset your RemindMe password</h2>
          <p>Hi ${recipientName},</p>
          <p>We received a request to reset your password. This link expires in one hour.</p>
          <p><a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;">Reset password</a></p>
          <p style="font-size: 12px; color: #64748b;">If you did not request this, you can safely ignore this email.</p>
        </div>`,
      });
      logger.info(`[EmailProvider] Password reset email accepted for ${to}. Message ID: ${result.messageId}.`);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown email provider error';
      logger.error(`[EmailProvider] Failed to send password reset email to ${to}`, err);
      return { success: false, error: message };
    }
  }
}

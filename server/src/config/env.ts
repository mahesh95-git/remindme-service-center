import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/car_service_reminder',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey_remindme_service_2026_xyz!',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  REMINDER_CRON: process.env.REMINDER_CRON || '0 8 * * *',
  REMINDER_TIMEZONE: process.env.REMINDER_TIMEZONE || 'Asia/Kolkata',
  REMINDER_LEAD_DAYS: (process.env.REMINDER_LEAD_DAYS || '30,15,7,1')
    .split(',')
    .map(value => Number(value.trim()))
    .filter(value => Number.isInteger(value) && value >= 0),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '"RemindMe" <noreply@remindme.in>',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};

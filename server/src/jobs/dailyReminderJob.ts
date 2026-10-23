import cron from 'node-cron';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { runReminderEngine } from '../modules/reminders/service.js';

export function startReminderScheduler() {
  logger.info(`[Scheduler] Initializing daily email reminder job with cron: "${ENV.REMINDER_CRON}" (${ENV.REMINDER_TIMEZONE})`);

  cron.schedule(ENV.REMINDER_CRON, async () => {
    logger.info('[Scheduler] Executing scheduled daily vehicle email reminder job...');
    try {
      const summary = await runReminderEngine();
      logger.info(
        `[Scheduler] Email reminder job completed. Checked: ${summary.totalChecked}, Created: ${summary.totalCreated}, Sent: ${summary.totalSent}, Failed: ${summary.totalFailed}, Skipped: ${summary.totalSkipped}`
      );
    } catch (err) {
      logger.error('[Scheduler] Error running daily reminder job:', err);
    }
  }, { timezone: ENV.REMINDER_TIMEZONE });
}

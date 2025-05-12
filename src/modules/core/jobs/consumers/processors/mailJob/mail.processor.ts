import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { GoogleMailService } from '@/modules/mail/google-mail.service';
import { MAIL_QUEUE, MailJobData } from '@/modules/core/jobs/producers/producers.types';
import { BaseProcessor } from '../base.processor';
import { AppConfig } from '@/modules/core/AppConfig';

@Processor(MAIL_QUEUE)
export class MailProcessor extends BaseProcessor<MailJobData> {
  constructor(
    private readonly googleMailService: GoogleMailService,
    private readonly appConfig: AppConfig,
  ) {
    super(MAIL_QUEUE);
  }

  async processJob(job: Job<any, any, string>): Promise<void> {
    if (!this.appConfig.emailsEnabled) {
      this.logger.log('Mock mailing is enabled, skipping actual email send');
      return;
    }

    const { to, subject, body } = job.data;
    await this.googleMailService.sendEmail({ to, subject, body });
  }
}

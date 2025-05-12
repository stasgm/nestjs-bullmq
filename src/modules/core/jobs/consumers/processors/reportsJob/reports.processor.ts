import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { REPORTS_QUEUE, ReportsJobData } from '@/modules/core/jobs/producers/producers.types';
import { BaseProcessor } from '../base.processor';
import { ReportsService } from '@/modules/reports/reports.service';
import { getErrorMessage } from '@/libs/helpers';
import { MailService } from '@/modules/mail/mail.service';

@Processor(REPORTS_QUEUE)
export class ReportsProcessor extends BaseProcessor<ReportsJobData> {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly mailService: MailService,
  ) {
    super(REPORTS_QUEUE);
  }

  async processJob(job: Job<ReportsJobData>): Promise<void> {
    try {
      await this.reportsService.updateStatusById(job.data.reportId, 'in-progress');
      // TODO: Add report building logic here

      await this.mailService.sendMail({
        subject: `Report ${job.data.name} Ready`,
        body: 'Your report is ready!',
        to: job.data.name,
      });

      await this.reportsService.updateStatusById(job.data.reportId, 'completed');
    } catch (error) {
      this.logger.error(`Failed to process report job: ${getErrorMessage(error)}`);
      await this.reportsService.updateStatusById(job.data.reportId, 'failed');
      throw error;
    }
  }
}

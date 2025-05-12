import { Injectable } from '@nestjs/common';

import { MAIL_QUEUE, MailJobData } from '@/modules/core/jobs/producers/producers.types';
import { JobsProducersService } from '@/modules/core/jobs/producers/producers.service';

@Injectable()
export class MailService {
  constructor(private readonly jobsProducersService: JobsProducersService) {}

  async sendMail(data: MailJobData) {
    await this.jobsProducersService.insertNewJob({
      name: MAIL_QUEUE,
      data,
    });
  }
}

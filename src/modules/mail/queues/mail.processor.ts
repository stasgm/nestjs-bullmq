import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { QUEUE_NAME } from './mail.constants';

@Processor(QUEUE_NAME)
export class MailProcessor extends WorkerHost {
  private readonly logger: Logger = new Logger(MailProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Sending email on ${QUEUE_NAME}, Job with id: ${job.id} and args: ${JSON.stringify(job.data)}`);

    await this.mailerService.sendMail(job.data.payload);
  }

  @OnWorkerEvent('completed')
  async onCompleted({ id, data }: { id: string; data: number | object }) {
    this.logger.log(`Completed event on ${QUEUE_NAME}, Job with id: ${id} and args: ${JSON.stringify(data)}`);
  }

  @OnWorkerEvent('failed')
  onFailed({ id, data }: { id: string; data: number | object }) {
    this.logger.log(`Failed event on ${QUEUE_NAME}, Job with id: ${id} and args: ${JSON.stringify(data)}`);
  }
}

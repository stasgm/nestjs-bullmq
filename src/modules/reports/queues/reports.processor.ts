import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { REPORTS_BUILDER_QUEUE } from './reports.constants';
import { MailService } from '../../mail/mail.service';
import { ReportsService } from '../reports.service';

export type reportParamsT = {
  name: string;
  params: {
    dateBegin: string;
    dateEnd: string;
  };
};

@Processor(REPORTS_BUILDER_QUEUE)
export class ReportsBuilderProcessor extends WorkerHost {
  private readonly logger: Logger = new Logger(ReportsBuilderProcessor.name);

  constructor(
    private readonly mailerService: MailService,
    private readonly reportsService: ReportsService,
  ) {
    super();
  }

  async process(job: Job<reportParamsT, any, string>): Promise<any> {
    this.logger.log(
      `Processing event on ${REPORTS_BUILDER_QUEUE}, Job with id: ${job.id} and args: ${JSON.stringify(job.data)}`,
    );

    const itemCount = 3;
    const steps = Array(itemCount).fill(0);
    const delay = 4000;

    for await (const [idx, step] of steps.entries()) {
      try {
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (job.data.name === '') {
              return reject(new Error('Failed'));
            }

            const progressPercent = Math.round((idx + 1) * (1 / itemCount) * 100);

            job.updateProgress(progressPercent);

            return resolve(`Success: ${step}`);
          }, delay);
        });
      } catch (err) {
        throw new Error(err);
      }
    }
  }

  @OnWorkerEvent('active')
  async onActive({ id, data }: { id: string; data: object }) {
    this.logger.log(`Active event on ${REPORTS_BUILDER_QUEUE}, Job with id: ${id} and args: ${JSON.stringify(data)}`);

    await this.reportsService.updateStatusByJobId(id, 'in-progress');
  }

  @OnWorkerEvent('progress')
  onProgress({ id, data }: { id: string; data: object }, progres: number) {
    this.logger.log(
      `Event progress on ${REPORTS_BUILDER_QUEUE}, Job with id: ${id} and args: ${JSON.stringify(data)} - ${progres}`,
    );
  }

  @OnWorkerEvent('completed')
  async onCompleted({ id, data }: { id: string; data: reportParamsT }) {
    const user: { email: string; name: string } = {
      email: 'stasgm@gmail.com',
      name: 'Stas',
    };

    this.logger.log(`Completed event on ${REPORTS_BUILDER_QUEUE}, Job with id: ${id} and args: ${JSON.stringify(data)}`);

    await this.reportsService.updateStatusByJobId(id, 'completed');

    await this.mailerService.sendMail(user, data);

    this.logger.log(`Email job added to the mail queue: ${JSON.stringify(user)}`);
  }

  @OnWorkerEvent('failed')
  async onFailed({ id, data }: { id: string; data: number | object }) {
    this.logger.error(`Failed event on ${REPORTS_BUILDER_QUEUE}, Job with id: ${id} and args: ${JSON.stringify(data)}`);

    await this.reportsService.updateStatusByJobId(id, 'failed');
  }
}

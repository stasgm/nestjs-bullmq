import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { QUEUE_NAME } from './reports.constants';

@Processor(QUEUE_NAME)
export class ReportBuilderProcessor extends WorkerHost {
  private readonly logger: Logger = new Logger(ReportBuilderProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing event on ${QUEUE_NAME}, Job with id: ${
        job.id
      } and args: ${JSON.stringify(job.data)}`,
    );

    const fail = job.data.fail;

    const itemCount = 13;
    const steps = Array(itemCount).fill(0);

    for await (const [idx, step] of steps.entries()) {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (fail) {
            return reject(new Error('Failed'));
          }

          const progressPercent = Math.round((idx + 1) * (1 / itemCount) * 100);

          job.updateProgress(progressPercent);

          return resolve(`Success: ${step}`);
        }, 1000);
      });
    }
  }

  @OnWorkerEvent('active')
  onActive({ id, data }: { id: string; data: number | object }) {
    this.logger.log(
      `Active event on ${QUEUE_NAME}, Job with id: ${id} and args: ${JSON.stringify(
        data,
      )}`,
    );
  }

  @OnWorkerEvent('progress')
  onProgress(
    { id, data }: { id: string; data: number | object },
    progres: number | object,
  ) {
    this.logger.log(
      `Event progress on ${QUEUE_NAME}, Job with id: ${id} and args: ${JSON.stringify(
        data,
      )} - ${typeof progres === 'object' ? JSON.stringify(data) : progres} `,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted({ id, data }: { id: string; data: number | object }) {
    this.logger.log(
      `Completed event on ${QUEUE_NAME}, Job with id: ${id} and args: ${JSON.stringify(
        data,
      )}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed({ id, data }: { id: string; data: number | object }) {
    this.logger.log(
      `Failed event on ${QUEUE_NAME}, Job with id: ${id} and args: ${JSON.stringify(
        data,
      )}`,
    );
  }
}
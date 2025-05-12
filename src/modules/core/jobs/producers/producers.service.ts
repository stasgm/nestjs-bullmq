/* eslint-disable complexity */
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { DateTime } from 'luxon';

import {
  InsertNewJobType,
  JobDataTypes,
  MAIL_QUEUE,
  MailJobData,
  QueueTypes,
  REPORTS_QUEUE,
  ReportsJobData,
} from './producers.types';

@Injectable()
export class JobsProducersService {
  readonly queueMapper: { [queueType in QueueTypes]?: Queue } = {
    [REPORTS_QUEUE]: this.reportsQueue,
    [MAIL_QUEUE]: this.mailQueue,
  } as const;

  private readonly logger: Logger;

  constructor(
    loggerService: Logger,
    @InjectQueue(REPORTS_QUEUE)
    private readonly reportsQueue: Queue<ReportsJobData>,
    @InjectQueue(MAIL_QUEUE)
    private readonly mailQueue: Queue<MailJobData>,
  ) {
    this.logger = new Logger('JobsProducers');
  }

  private logNewJob(queueName: string, job: Job): void {
    this.logger.log(`Job '${job.name}' added to ${queueName}`);
  }

  /**
   * Calculate duration in milliseconds between current date and later
   * @param later can be a future date or milliseconds
   * @returns number of milliseconds between current date and later
   */
  private calculateDelay(later: Date | number): number {
    const luxonAppDate = DateTime.now();
    const targetTime =
      typeof later === 'number' ? luxonAppDate.plus({ milliseconds: later }) : DateTime.fromJSDate(later);
    const delayTime = targetTime.diff(luxonAppDate).milliseconds;
    return Math.max(delayTime, 0);
  }

  async insertNewJob<T extends keyof JobDataTypes>({
    name,
    data,
    createdBy = 'system',
    runAt = DateTime.now().toJSDate(),
    maxRetries = 3,
    priority = undefined,
    backoff = undefined,
    options = undefined,
  }: InsertNewJobType<T>) {
    const queue = this.queueMapper[name];

    if (!queue) {
      throw new Error(`Queue '${name}' not found`);
    }

    const job = await queue.add(
      name,
      { ...data, createdBy },
      {
        attempts: maxRetries,
        priority,
        timestamp: DateTime.now().toMillis(),
        delay: this.calculateDelay(runAt),
        ...(backoff && { backoff }),
        ...options,
      },
    );

    this.logNewJob(name, job);

    return { queue, job };
  }

  public async getJob(name: keyof JobDataTypes, id: string): Promise<Job> {
    const queue = this.queueMapper[name];
    if (!queue) {
      throw new Error(`Queue '${name}' not found`);
    }
    return queue.getJob(id);
  }
}

import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';

export abstract class BaseProcessor<TJobData> extends WorkerHost {
  protected readonly processorName: string;
  protected readonly logger: Logger;

  constructor(protected readonly queueName: string) {
    super();
    this.processorName = this.constructor.name;
    this.logger = new Logger(this.processorName);
    this.logger.log(`Initializing processor for queue ${this.queueName}`);
  }

  protected abstract processJob(job: Job<TJobData, void | boolean, string>): Promise<any>;

  public async process(job: Job<TJobData, void, string>): Promise<any> {
    this.logger.log(`Processing event on ${this.queueName}. JobId: ${job.id}`);
    // TODO: add sentry integration
    return this.processJob(job);
  }

  @OnWorkerEvent('active')
  async onActive({ id }: { id: string; data: TJobData }) {
    this.logger.log(`Active event on ${this.queueName}. JobId: ${id}`);
  }

  @OnWorkerEvent('progress')
  onProgress({ id }: { id: string; data: TJobData }, progress: number) {
    this.logger.log(`Event progress on ${this.queueName}. JobId: ${id}, progress: ${progress}`);
  }

  @OnWorkerEvent('completed')
  async onCompleted({ id }: { id: string; data: TJobData }) {
    this.logger.log(`Completed event on ${this.queueName}. JobId: ${id}`);
  }

  @OnWorkerEvent('failed')
  async onFailed({ id }: { id: string; data: TJobData }, error: Error) {
    this.logger.error(`Failed event on ${this.queueName}. JobId: ${id}, error: ${error.message}`);
  }
}

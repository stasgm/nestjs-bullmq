import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TRANSCODE_QUEUE } from './constants';
import { Logger } from '@nestjs/common';

@Processor(TRANSCODE_QUEUE)
export class TranscodeConsumer extends WorkerHost {
  private readonly logger = new Logger(TranscodeConsumer.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(JSON.stringify(job));
    this.logger.debug(`Data: ${JSON.stringify(job.data)}`);
  }

  @OnWorkerEvent('completed')
  onCompleted() {
    // do some stuff
  }
}

import { Global, Logger, Module } from '@nestjs/common';
import { DefaultJobOptions } from 'bullmq';
import { BullModule, RegisterQueueOptions } from '@nestjs/bullmq';
import IORedis from 'ioredis';

import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { AppConfig } from '../../AppConfig';
import { JobsProducersService } from './producers.service';
import { getBullmqPrefix, MAIL_QUEUE, REPORTS_QUEUE } from './producers.types';

const GLOBAL_DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 3,
  backoff: { type: 'fixed', delay: 1000 * 60 },
  removeOnComplete: {
    age: 60 * 60 * 24 * 14, // 14 days in seconds
  },
  removeOnFail: {
    age: 60 * 60 * 24 * 30 * 6, // 6 months in seconds
  },
};

const REGISTERED_QUEUES: RegisterQueueOptions[] = [
  { name: MAIL_QUEUE, defaultJobOptions: { ...GLOBAL_DEFAULT_JOB_OPTIONS } },
  { name: REPORTS_QUEUE },
].map((queue) => ({ ...queue, defaultJobOptions: { ...GLOBAL_DEFAULT_JOB_OPTIONS, ...queue.defaultJobOptions } }));

const bullmqDashboardModules = () => {
  return [
    BullBoardModule.forRoot({ route: '/queues', adapter: ExpressAdapter }),
    BullBoardModule.forFeature(...REGISTERED_QUEUES.map((q) => ({ name: q.name as string, adapter: BullMQAdapter }))),
  ];
};

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (appConfig: AppConfig) => ({
        connection: new IORedis(appConfig.redisUrl, {
          maxRetriesPerRequest: null,
        }),
        defaultJobOptions: GLOBAL_DEFAULT_JOB_OPTIONS,
        prefix: getBullmqPrefix(appConfig.environment),
      }),
    }),
    BullModule.registerQueue(...REGISTERED_QUEUES),
    ...bullmqDashboardModules(),
  ],
  providers: [JobsProducersService, Logger],
  exports: [JobsProducersService],
})
export class JobsProducersModule {}

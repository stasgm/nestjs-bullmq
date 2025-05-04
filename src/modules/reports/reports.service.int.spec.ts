import { Test, TestingModule } from '@nestjs/testing';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue, QueueEvents, removeAllQueueData } from 'bullmq';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { ReportsService } from './reports.service';
import { REPORTS_BUILDER_QUEUE, REPORT_BUILDER_JOB } from './queues/reports.constants';
import { ReportsRepository } from './reports.repository';
import { ReportsBuilderProcessor, reportParamsT } from './queues/reports.processor';
import { MailModule } from '../mail/mail.module';
import { MailService } from '../mail/mail.service';
import { PersistenceModule } from '../_core/persistence/persistence.module';
import { MAIL_QUEUE } from '../mail/queues/mail.constants';
import { BullBoardModule } from '@bull-board/nestjs';

const reportJobData: { id: string; data: reportParamsT } = {
  id: '1',
  data: {
    name: 'my-job',
    params: {
      dateBegin: '2023-07-01',
      dateEnd: '2023-07-18',
    },
  },
};

describe('Reports Service', () => {
  let service: ReportsService;
  let repository: DeepMockProxy<ReportsRepository>;
  let queue: Queue<reportParamsT>;
  let queueEvents: QueueEvents;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MailModule,
        PersistenceModule,
        ConfigModule.forRoot({
          envFilePath: `${process.env.NODE_ENV ?? ''}.env`,
        }),
        BullModule.forRootAsync({
          inject: [ConfigService],
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            connection: {
              host: configService.get<string>('REDIS_HOST'),
              port: +configService.get<number>('REDIS_PORT'),
            },
            defaultJobOptions: {
              attempts: 3,
              backoff: {
                type: 'fixed',
                delay: 0,
              },
            },
          }),
        }),
        BullModule.registerQueue({ name: REPORTS_BUILDER_QUEUE }),
      ],
      providers: [ReportsService, ReportsRepository, ReportsBuilderProcessor],
    })
      .overrideProvider(MailService)
      .useValue(mockDeep<MailService>())
      .overrideProvider(BullBoardModule)
      .useValue(mockDeep<BullBoardModule>())
      .compile();

    await module.init();

    service = module.get(ReportsService);
    repository = module.get(ReportsRepository);
    queue = module.get(getQueueToken(REPORTS_BUILDER_QUEUE));
    queueEvents = new QueueEvents(REPORTS_BUILDER_QUEUE, {
      connection: queue.opts.connection,
    });

    // Remove test db data
    await repository.deleteReports({});
    // Remove test queues data
    await removeAllQueueData(await queue.client, REPORTS_BUILDER_QUEUE);
    await removeAllQueueData(await queue.client, MAIL_QUEUE);
  });

  afterEach(async () => {
    await queueEvents.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(queue).toBeDefined();
    expect(queue.name).toEqual(REPORTS_BUILDER_QUEUE);
    expect(queueEvents).toBeDefined();
  });

  it('should add a new job, proccess and successfully complete it', async () => {
    const addJobToQueue = jest.spyOn(queue, 'add');

    const report = await service.build({ name: 'report-1', params: reportJobData });

    expect(addJobToQueue).toHaveBeenCalledTimes(1);
    expect(addJobToQueue).toHaveBeenCalledWith(REPORT_BUILDER_JOB, {
      name: 'report-1',
      params: reportJobData,
    });

    const job = await queue.getJob(report.jobId);
    await job.waitUntilFinished(queueEvents);
    await expect(job.getState()).resolves.toBe('completed');
  });

  it('should add a new job, proccess and fail', async () => {
    const addJobToQueue = jest.spyOn(queue, 'add');

    const report = await service.build({ name: '', params: reportJobData });

    expect(addJobToQueue).toHaveBeenCalledTimes(1);
    expect(addJobToQueue).toHaveBeenCalledWith(REPORT_BUILDER_JOB, {
      name: '',
      params: reportJobData,
    });

    const job = await queue.getJob(report.jobId);
    await expect(job.waitUntilFinished(queueEvents)).rejects.toThrow('Report name should not be empty');
    await expect(job.getState()).resolves.toBe('failed');
  });
});

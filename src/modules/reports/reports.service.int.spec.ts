import { Test, TestingModule } from '@nestjs/testing';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Report } from '@prisma/client';

import { ReportsService } from './reports.service';
import { REPORTS_BUILDER_QUEUE } from './queues/reports.constants';
import { ReportsRepository } from './reports.repository';
import { ReportsBuilderProcessor, reportParamsT } from './queues/reports.processor';
import { MailModule } from '../mail/mail.module';
import { MailService } from '../mail/mail.service';

const reportDataMock: Report = {
  id: '1',
  jobId: '1',
  name: 'my-job',
  params: {
    dateBegin: '2023-07-01',
    dateEnd: '2023-07-18',
  },
  path: 'my-job-1',
  status: 'complete',
};

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

const reportJob = {
  ...reportJobData,
  progress: 0,
  updateProgress: async (progress) => {
    reportJob.progress = progress;
  },
} as Job;

describe('Reports Service', () => {
  let service: ReportsService;
  let repository: DeepMockProxy<ReportsRepository>;
  let queue: Queue<reportParamsT>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MailModule,
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
                delay: 1000,
              },
            },
          }),
        }),
        BullModule.registerQueue({ name: REPORTS_BUILDER_QUEUE }),
      ],
      providers: [ReportsService, ReportsRepository, ReportsBuilderProcessor],
    })
      .overrideProvider(ReportsRepository)
      .useValue(mockDeep<ReportsRepository>())
      .overrideProvider(MailService)
      .useValue(mockDeep<MailService>())
      .compile();

    service = module.get(ReportsService);
    repository = module.get(ReportsRepository);
    queue = module.get(getQueueToken(REPORTS_BUILDER_QUEUE));
  });

  afterEach(() => {
    // Remove test queue
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(queue).toBeDefined();
  });

  it('should add a new job to the reports queue', async () => {
    repository.createReport.mockResolvedValue(reportDataMock);
    const addJobToQueue = jest.spyOn(queue, 'add');

    await service.build({ name: 'report-1', params: reportJobData });
    expect(addJobToQueue).toHaveBeenCalledTimes(1);
  });
});

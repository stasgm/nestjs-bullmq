import { Test, TestingModule } from '@nestjs/testing';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Report } from '@prisma/client';

import { ReportsService } from '../reports.service';
import { REPORT_BUILDER_QUEUE } from '../queues/reports.constants';
import { MailService } from '../../mail/mail.service';
import { MAIL_QUEUE } from '../../mail/queues/mail.constants';
import { ReportBuilderProcessor, reportParamsT } from './reports.processor';

const reportJobResponseMock: Report = {
  id: '1',
  jobId: '1',
  name: 'my-job',
  params: {
    dateBegin: '2023-07-18',
    dateEnd: '2023-07-01',
  },
  path: './my-job-1.xml',
  status: 'complete',
};

const reportJobData: { id: string; data: reportParamsT } = {
  id: '1',
  data: {
    name: 'my-job',
    params: {
      dateBegin: '2023-07-18',
      dateEnd: '2023-07-01',
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

describe('Reports processor', () => {
  let reportsService: DeepMockProxy<ReportsService>;
  let reportsQueue: DeepMockProxy<Queue>;
  let reportBuilderProcessor: ReportBuilderProcessor;
  let mailService: DeepMockProxy<MailService>;
  let mailQueue: DeepMockProxy<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue({ name: REPORT_BUILDER_QUEUE }),
        BullModule.registerQueue({ name: MAIL_QUEUE }),
      ],
      providers: [ReportsService, ReportBuilderProcessor, MailService],
    })
      .overrideProvider(getQueueToken(REPORT_BUILDER_QUEUE))
      .useValue(mockDeep<Queue>())
      .overrideProvider(ReportsService)
      .useValue(mockDeep<ReportsService>())
      .overrideProvider(getQueueToken(MAIL_QUEUE))
      .useValue(mockDeep<Queue>())
      .compile();

    reportsService = module.get(ReportsService);
    reportsQueue = module.get(getQueueToken(REPORT_BUILDER_QUEUE));
    reportBuilderProcessor = module.get(ReportBuilderProcessor);
    mailService = module.get(MailService);
    mailQueue = module.get(getQueueToken(MAIL_QUEUE));
  });

  it('should be defined', () => {
    expect(reportsService).toBeDefined();
    expect(reportsQueue).toBeDefined();
    expect(reportBuilderProcessor).toBeDefined();
    expect(mailService).toBeDefined();
    expect(mailQueue).toBeDefined();
  });

  it('should process the new job in the report queue', async () => {
    reportsService.updateStatusByJobId.mockResolvedValue(reportJobResponseMock);

    reportsQueue.add.mockResolvedValue(reportJob);
    const job = await reportsQueue.add('reports', reportJobData);

    expect(job.progress).toEqual(0);
    await reportBuilderProcessor.process(job);
    expect(job.progress).toEqual(100);

    expect(job.updateProgress).toHaveBeenCalledTimes(5);

    await reportBuilderProcessor.onCompleted({ id: job.id, data: job.data });

    expect(reportsService.updateStatusByJobId).toHaveBeenCalledTimes(1);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Report } from '@prisma/client';

import { ReportsService } from '../reports.service';
import { REPORTS_BUILDER_QUEUE } from '../queues/reports.constants';
import { MailService } from '../../mail/mail.service';
import { MAIL_QUEUE } from '../../mail/queues/mail.constants';
import { ReportsBuilderProcessor, reportParamsT } from './reports.processor';

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
  let reportsBuilderProcessor: ReportsBuilderProcessor;
  let mailService: DeepMockProxy<MailService>;
  let mailQueue: DeepMockProxy<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue({ name: REPORTS_BUILDER_QUEUE }),
        BullModule.registerQueue({ name: MAIL_QUEUE }),
      ],
      providers: [ReportsService, ReportsBuilderProcessor, MailService],
    })
      .overrideProvider(getQueueToken(REPORTS_BUILDER_QUEUE))
      .useValue(mockDeep<Queue>())
      .overrideProvider(ReportsService)
      .useValue(mockDeep<ReportsService>())
      .overrideProvider(getQueueToken(MAIL_QUEUE))
      .useValue(mockDeep<Queue>())
      .compile();

    reportsService = module.get(ReportsService);
    reportsQueue = module.get(getQueueToken(REPORTS_BUILDER_QUEUE));
    reportsBuilderProcessor = module.get(ReportsBuilderProcessor);
    mailService = module.get(MailService);
    mailQueue = module.get(getQueueToken(MAIL_QUEUE));
  });

  it('should be defined', () => {
    expect(reportsService).toBeDefined();
    expect(reportsQueue).toBeDefined();
    expect(reportsBuilderProcessor).toBeDefined();
    expect(mailService).toBeDefined();
    expect(mailQueue).toBeDefined();
  });

  it('should process the new job in the report queue', async () => {
    reportsService.updateStatusByJobId.mockResolvedValue(reportJobResponseMock);
    reportsQueue.add.mockResolvedValue(reportJob);

    const job = await reportsQueue.add('reports', reportJobData);
    const jobUpdateProgressSpy = jest.spyOn(job, 'updateProgress');

    expect(job.progress).toEqual(0);
    await reportsBuilderProcessor.process(job);
    expect(job.progress).toEqual(100);

    expect(jobUpdateProgressSpy).toHaveBeenCalledTimes(3);
    expect(jobUpdateProgressSpy).toHaveBeenLastCalledWith(100);

    await reportsBuilderProcessor.onCompleted({ id: job.id, data: job.data });

    expect(reportsService.updateStatusByJobId).toHaveBeenCalledTimes(1);
    expect(reportsService.updateStatusByJobId).toHaveBeenCalledWith(job.id, 'completed');
  });
});

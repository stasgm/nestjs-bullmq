import { Test } from '@nestjs/testing';
import { Job } from 'bullmq';
import { DeepMockProxy } from 'jest-mock-extended';
import { Report } from '@prisma/client';

import { ReportsProcessor } from './reports.processor';
import { ReportsService } from '@/modules/reports/reports.service';
import { MailService } from '@/modules/mail/mail.service';
import { ReportsJobData } from '@/modules/jobsProducers/jobsProducers.types';

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
  startedBy: 'test',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const reportJobData: { id: string; data: ReportsJobData } = {
  id: '1',
  data: {
    type: 'my-job',
    createdBy: 'test',
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
  let reportsBuilderProcessor: ReportsProcessor;
  let mailService: DeepMockProxy<MailService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReportsProcessor,
        {
          provide: ReportsService,
          useValue: {
            updateStatusByJobId: jest.fn(),
          },
        },
        { provide: MailService, useValue: {} },
      ],
    })
      .useMocker(() => ({}))
      .compile();

    reportsService = module.get(ReportsService);
    reportsBuilderProcessor = module.get(ReportsProcessor);
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(reportsService).toBeDefined();
    expect(reportsBuilderProcessor).toBeDefined();
    expect(mailService).toBeDefined();
  });

  it('should process the new job in the report queue', async () => {
    reportsService.updateStatusByJobId.mockResolvedValue(reportJobResponseMock);

    const jobUpdateProgressSpy = jest.spyOn(reportJob, 'updateProgress');

    expect(reportJob.progress).toEqual(0);
    await reportsBuilderProcessor.process(reportJob);
    expect(reportJob.progress).toEqual(100);

    expect(jobUpdateProgressSpy).toHaveBeenCalledTimes(3);
    expect(jobUpdateProgressSpy).toHaveBeenLastCalledWith(100);

    expect(reportsService.updateStatusByJobId).toHaveBeenCalledTimes(1);
    expect(reportsService.updateStatusByJobId).toHaveBeenCalledWith(reportJob.id, 'completed');
  });
});

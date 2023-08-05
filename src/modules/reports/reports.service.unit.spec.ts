import { Test, TestingModule } from '@nestjs/testing';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Report } from '@prisma/client';

import { ReportsService } from './reports.service';
import { REPORTS_BUILDER_QUEUE } from './queues/reports.constants';
import { ReportsRepository } from './reports.repository';
import { reportParamsT } from './queues/reports.processor';

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
  let queue: DeepMockProxy<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BullModule.registerQueue({ name: REPORTS_BUILDER_QUEUE, connection: {} })],
      providers: [ReportsService, ReportsRepository],
    })
      .overrideProvider(ReportsRepository)
      .useValue(mockDeep<ReportsRepository>())
      .overrideProvider(getQueueToken(REPORTS_BUILDER_QUEUE))
      .useValue(mockDeep<Queue>())
      .compile();

    service = module.get(ReportsService);
    repository = module.get(ReportsRepository);
    queue = module.get(getQueueToken(REPORTS_BUILDER_QUEUE));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(queue).toBeDefined();
    expect(queue.name).toEqual(REPORTS_BUILDER_QUEUE);
  });

  it('should add a new job to the reports queue', async () => {
    repository.createReport.mockResolvedValue(reportDataMock);
    queue.add.mockResolvedValue(reportJob);

    await service.build({ name: 'report-1', params: reportJobData });
    expect(queue.add).toHaveBeenCalledTimes(1);
  });
});

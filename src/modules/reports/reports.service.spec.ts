import { Test, TestingModule } from '@nestjs/testing';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Report } from '@prisma/client';

import { ReportsService } from './reports.service';
import { REPORT_BUILDER_QUEUE } from './queues/reports.constants';
import { ReportsRepository } from './reports.repository';

const reportMock: Report = {
  id: '1',
  jobId: '1',
  name: 'my-job',
  params: {},
  path: '',
  status: 'complete',
};

const queueMock = {
  id: '1',
  data: {
    name: 'my-job',
    params: {},
  },
  progress: 0,
};

describe('Reports Service', () => {
  let service: ReportsService;
  let repository: DeepMockProxy<ReportsRepository>;
  let queue: DeepMockProxy<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BullModule.registerQueue({ name: REPORT_BUILDER_QUEUE })],
      providers: [ReportsService, ReportsRepository],
    })
      .overrideProvider(ReportsRepository)
      .useValue(mockDeep<ReportsRepository>())
      .overrideProvider(getQueueToken(REPORT_BUILDER_QUEUE))
      .useValue(mockDeep<Queue>())
      .compile();

    service = module.get(ReportsService);
    repository = module.get(ReportsRepository);
    queue = module.get(getQueueToken(REPORT_BUILDER_QUEUE));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(queue).toBeDefined();
  });

  it('should add a new job to the reports queue', async () => {
    repository.createReport.mockResolvedValue(reportMock);
    queue.add.mockResolvedValue(queueMock as Job<any, any, string>);

    await service.build({ name: 'report-1', params: {} });
    expect(queue.add).toHaveBeenCalledTimes(1);
  });
});

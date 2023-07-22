import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAME } from './queues/reports.constants';

@Injectable()
export class ReportsService {
  constructor(@InjectQueue(QUEUE_NAME) private readonly reports: Queue) {}

  async getAll() {
    return [
      {
        id: '1',
        name: 'test-report',
        dateBegin: '2023-01-01',
        dateEnd: '2023-07-01',
      },
    ];
  }

  async build(dateBegin: string, dateEnd: string) {
    await this.reports.add(
      'reports',
      {
        dateBegin,
        dateEnd,
      },
      {
        attempts: 5,
      },
    );
  }
}

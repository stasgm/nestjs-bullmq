import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAME } from './queues/reports.constants';
import { ReportBuilderProcessor } from './queues/reports.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_NAME,
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportBuilderProcessor],
})
export class ReportsModule {}

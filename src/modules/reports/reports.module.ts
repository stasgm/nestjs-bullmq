import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { BullModule } from '@nestjs/bullmq';
import { REPORT_BUILDER_QUEUE } from './queues/reports.constants';
import { ReportBuilderProcessor } from './queues/reports.processor';
import { MailModule } from '../mail/mail.module';
import { PersistenceModule } from '../_core/persistence/persistence.module';
import { ReportsRepository } from './reports.repository';
// import { join } from 'path';

@Module({
  imports: [
    MailModule,
    PersistenceModule,
    BullModule.registerQueue({
      name: REPORT_BUILDER_QUEUE,
      // processors: [
      //   {
      //     concurrency: 3,
      //     path: join(__dirname, 'reports.processor.js'),
      //   },
      // ],
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportBuilderProcessor, ReportsRepository],
})
export class ReportsModule {}

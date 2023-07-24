import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAME } from './queues/reports.constants';
import { ReportBuilderProcessor } from './queues/reports.processor';
import { MailModule } from '../mail/mail.module';
import { PersistenceModule } from '../_core/persistence/persistence.module';
import { ReportsRepository } from './reports.repository';

@Module({
  imports: [
    MailModule,
    PersistenceModule,
    BullModule.registerQueue({
      name: QUEUE_NAME,
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportBuilderProcessor, ReportsRepository],
})
export class ReportsModule {}

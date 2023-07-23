import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAME } from './queues/reports.constants';
import { ReportBuilderProcessor } from './queues/reports.processor';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MailModule,
    BullModule.registerQueue({
      name: QUEUE_NAME,
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportBuilderProcessor],
})
export class ReportsModule {}

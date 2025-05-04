import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { BullModule } from '@nestjs/bullmq';
import { REPORTS_BUILDER_QUEUE } from './queues/reports.constants';
import { ReportsBuilderProcessor } from './queues/reports.processor';
import { MailModule } from '../mail/mail.module';
import { PersistenceModule } from '../_core/persistence/persistence.module';
import { ReportsRepository } from './reports.repository';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
// import { join } from 'path';

@Module({
  imports: [
    MailModule,
    PersistenceModule,
    BullModule.registerQueue({
      name: REPORTS_BUILDER_QUEUE,
      // processors: [
      //   {
      //     concurrency: 3,
      //     path: join(__dirname, 'reports.processor.js'),
      //   },
      // ],
    }),
    BullBoardModule.forFeature({
      name: REPORTS_BUILDER_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsBuilderProcessor, ReportsRepository],
})
export class ReportsModule {}

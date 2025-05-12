import { Logger, Module } from '@nestjs/common';

import { MailModule } from '@/modules/mail/mail.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { ReportsProcessor } from './processors/reportsJob/reports.processor';
import { MailProcessor } from './processors/mailJob/mail.processor';

@Module({
  imports: [MailModule, ReportsModule],
  providers: [ReportsProcessor, MailProcessor, Logger],
})
export class JobsConsumersModule {}

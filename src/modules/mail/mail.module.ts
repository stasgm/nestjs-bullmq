import { Module } from '@nestjs/common';
import { JobsProducersModule } from '@/modules/core/jobs/producers/producers.module';
import { GoogleMailService } from './google-mail.service';
import { MailService } from './mail.service';

@Module({
  imports: [JobsProducersModule],
  providers: [MailService, GoogleMailService],
  exports: [MailService, GoogleMailService],
})
export class MailModule {}

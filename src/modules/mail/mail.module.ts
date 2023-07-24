/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MailService } from './mail.service';
import { QUEUE_NAME } from './queues/mail.constants';
import { MailProcessor } from './queues/mail.processor';
import { ReportsModule } from '../reports/reports.module';
import { ReportsService } from '../reports/reports.service';

@Module({
  imports: [
    // forwardRef(() => ReportsModule),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // useFactory: () => ({
        transport: 'smtps://username:password@smtp.example.com',
        defaults: { from: `"No reply" <${configService.get<string>('GOOGLE_API_EMAIL')}>` },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
    BullModule.registerQueue({
      name: QUEUE_NAME,
    }),
  ],
  providers: [MailService, MailProcessor, ConfigService],
  // , ReportsService
  exports: [MailService],
})
export class MailModule {}

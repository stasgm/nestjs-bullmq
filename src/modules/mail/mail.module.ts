import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MailService } from './mail.service';
import { QUEUE_NAME } from './queues/mail.constants';
import { MailProcessor } from './queues/mail.processor';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // transport: 'smtps://user@domain.com:pass@smtp.domain.com',
        transport: {
          host: configService.get('EMAIL_HOST'),
          port: +configService.get('EMAIL_PORT'),
          secure: true,
          auth: {
            user: configService.get('EMAIL_ADDRESS'),
            pass: configService.get('EMAIL_PASSWORD'),
          },
          tls: { rejectUnauthorized: false },
        },
        defaults: { from: '"No reply" <noreply@localhost>' },
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
  exports: [MailService],
})
export class MailModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';

import { MailService } from './mail.service';
import { QUEUE_NAME } from './queues/mail.constants';
import { MailProcessor } from './queues/mail.processor';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: 'smtps://username:password@smtp.example.com',
        defaults: { from: '"No reply" <web.developer.1067@gmail.com>' },
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

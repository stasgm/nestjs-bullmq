import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ReportsModule } from './modules/reports/reports.module';
import { MailModule } from './modules/mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';

@Module({
  imports: [
    ReportsModule,
    MailModule,
    ConfigModule.forRoot({
      envFilePath: `${process.env.NODE_ENV ?? ''}.env`,
      validate: (config) => {
        const configValidationSchema = z.object({
          GOOGLE_API_CLIENT_ID: z.string(),
          GOOGLE_API_CLIENT_SECRET: z.string(),
          GOOGLE_API_REFRESH_TOKEN: z.string(),
          GOOGLE_API_EMAIL: z.string(),
          REDIS_HOST: z.string(),
          REDIS_PORT: z.string().transform((value) => parseInt(value)),
        });

        return configValidationSchema.parse(config);
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: +configService.get<number>('REDIS_PORT'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'fixed',
            delay: 1000,
          },
        },
      }),
    }),
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}

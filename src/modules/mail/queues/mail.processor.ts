import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Options } from 'nodemailer/lib/smtp-transport';

import { MAIL_QUEUE } from './mail.constants';
import { ConfigService } from '@nestjs/config';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger: Logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<void> {
    this.logger.log(`Sending email on ${MAIL_QUEUE}, Job with id: ${job.id} and args: ${JSON.stringify(job.data)}`);

    if (this.configService.get('MOCK_MAILILNG') === true) {
      return;
    }

    await this.setTransport();
    try {
      await this.mailerService.sendMail(job.data);
    } catch (err) {
      this.logger.error(`Failed event on ${MAIL_QUEUE}, Job with id: ${job.id}. ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted({ id, data }: { id: string; data: object }) {
    // set 'emailsend' flag for the corresponding entry in the reports table

    this.logger.log(`Completed event on ${MAIL_QUEUE}, Job with id: ${id} and args: ${JSON.stringify(data)}`);
  }

  @OnWorkerEvent('failed')
  onFailed({ id, data }: { id: string; data: number | object }) {
    this.logger.error(`Failed event on ${MAIL_QUEUE}, Job with id: ${id} and args: ${JSON.stringify(data)}`);
  }

  private async setTransport() {
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2({
      clientId: this.configService.get('GOOGLE_API_CLIENT_ID'),
      clientSecret: this.configService.get('GOOGLE_API_CLIENT_SECRET'),
      redirectUri: 'https://developers.google.com/oauthplayground',
    });

    oauth2Client.setCredentials({
      refresh_token: this.configService.get('GOOGLE_API_REFRESH_TOKEN'),
    });

    const accessToken: string = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject('Failed to create access token');
        }
        resolve(token);
      });
    });

    const config: Options = {
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.configService.get('GOOGLE_API_EMAIL'),
        clientId: this.configService.get('GOOGLE_CLIENT_ID'),
        clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET'),
        accessToken,
      },
    };
    this.mailerService.addTransporter('gmail', config);
  }
}

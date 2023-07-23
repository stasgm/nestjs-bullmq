import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAME } from './queues/mail.constants';

@Injectable()
export class MailService {
  constructor(@InjectQueue(QUEUE_NAME) private readonly mailQueue: Queue) {}

  async sendMail(user: { email: string; name: string }, data: { reportInfo: string }) {
    await this.mailQueue.add('mailer', {
      to: user.email,
      subject: 'Your report is ready',
      template: 'ReportBuilt',
      context: {
        name: user.name || user.email,
        data,
      },
    });
  }
}

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAME } from './queues/mail.constants';

@Injectable()
export class MailService {
  constructor(@InjectQueue(QUEUE_NAME) private readonly mailQueue: Queue) {}

  async sendMail(user: { email: string; name: string }, data: { dateBegin: string; dateEnd: string }) {
    await this.mailQueue.add('mailer', {
      // transporterName: 'gmail',
      to: user.email,
      subject: 'Your report is ready',
      template: 'report-built',
      context: {
        name: user.name || user.email,
        dateBegin: data.dateBegin,
        dateEnd: data.dateEnd,
      },
    });
  }
}

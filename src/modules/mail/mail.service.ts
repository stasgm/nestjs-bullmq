import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MAIL_QUEUE } from './queues/mail.constants';

interface IMailData {
  name: string;
  params: { dateBegin: string; dateEnd: string };
}
@Injectable()
export class MailService {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue) {}

  async sendMail(user: { email: string; name: string }, data: IMailData) {
    await this.mailQueue.add('mailer', {
      transporterName: 'gmail',
      to: user.email,
      subject: 'Your report is ready',
      template: 'report-built',
      context: {
        reportName: data.name,
        name: user.name || user.email,
        dateBegin: data.params.dateBegin,
        dateEnd: data.params.dateEnd,
      },
    });
  }
}

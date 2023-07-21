import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { TRANSCODE_QUEUE } from './constants';

@Injectable()
export class AppService {
  constructor(
    @InjectQueue(TRANSCODE_QUEUE) private readonly transcodeQueue: Queue,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async transcode() {
    await this.transcodeQueue.add(
      'transcode',
      {
        fileName: './file.mp3',
      },
      {},
    );
  }
}

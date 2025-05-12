import { NestFactory } from '@nestjs/core';
import { INestApplication, Logger } from '@nestjs/common';

import { AppModule } from './app.module';
import { AppConfig } from './modules/core/AppConfig';

export async function bootstrap(app: INestApplication = null) {
  const logger = new Logger('Bootstrap');

  app = app ?? (await NestFactory.create(AppModule, { bufferLogs: true }));

  const appConfig = app.get(AppConfig);
  const port = appConfig.appPort;

  await app.listen(port);

  logger.log(`Application is running on: ${await app.getUrl()} and PID ${process.pid}`);
}

bootstrap();

import { INestApplication, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { getErrorMessage } from '@/libs/helpers';
import { AppConfig } from '@/modules/core/AppConfig';

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'beforeExit'> implements OnModuleInit {
  private readonly maxRetries = 5;
  private readonly retryDelay = 5000; // 5 seconds
  private readonly logger: Logger;

  constructor(readonly appConfig: AppConfig) {
    const url = appConfig.postgresUrl;

    if (!url) {
      throw new Error('Postgres url is not set');
    }

    super({
      datasources: {
        db: {
          url,
        },
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    this.logger = new Logger('PrismaService');
  }

  async onModuleInit() {
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to the database');
        return;
      } catch (error) {
        retries++;

        const errorMessage = getErrorMessage(error);
        this.logger.error(`Failed to connect to the database (attempt ${retries}/${this.maxRetries}): ${errorMessage}`);

        if (retries === this.maxRetries) {
          this.logger.error('Max retries reached. Could not connect to the database');
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      try {
        await app.close();
      } catch (error) {
        this.logger.error(`Error during application shutdown: ${getErrorMessage(error)}`);
        throw error;
      }
    });
  }
}

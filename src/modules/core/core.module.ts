import { Global, Logger, Module } from '@nestjs/common';

import { PrismaService } from './persistence/prisma/prisma.service';
import { AppConfig } from './AppConfig';
import { JobsProducersModule } from './jobs/producers/producers.module';
import { JobsConsumersModule } from './jobs/consumers/consumers.module';

@Global()
@Module({
  imports: [JobsProducersModule, JobsConsumersModule],
  providers: [AppConfig, PrismaService, Logger],
  exports: [PrismaService, AppConfig, JobsProducersModule, JobsConsumersModule],
})
export class CoreModule {}

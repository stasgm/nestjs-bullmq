import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Report } from '@prisma/client';

import { QUEUE_NAME } from './queues/reports.constants';
import { ReportsRepository } from './reports.repository';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { BuildReportDto } from './dto/build-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectQueue(QUEUE_NAME) private readonly reportsQueue: Queue,
    private productsRepository: ReportsRepository,
  ) {}

  findAll(): Promise<Report[]> {
    return this.productsRepository.getReports({});
  }

  findById(id: string): Promise<Report | null> {
    return this.productsRepository.getReport({ where: { id } });
  }

  create(createReportDto: CreateReportDto): Promise<Report> {
    return this.productsRepository.createReport({ data: createReportDto });
  }

  update(id: string, updateReportDto: UpdateReportDto) {
    return this.productsRepository.updateReport({
      where: { id },
      data: updateReportDto,
    });
  }

  remove(id: string) {
    return this.productsRepository.deleteReport({ where: { id } });
  }

  updateStatusByJobId(jobId: string, status: string) {
    return this.productsRepository.updateReport({
      where: { jobId: jobId },
      data: {
        status,
      },
    });
  }

  async build(buildReportDto: BuildReportDto) {
    const job = await this.reportsQueue.add('reports', buildReportDto);

    await this.create({
      name: job.data.name,
      params: job.data.params,
      jobId: job.id,
      path: `./$job.data.name}-${job.id}`,
    });
  }

  async stopBuild(id: string) {
    const job = await this.reportsQueue.getJob(id);
    job.discard();
  }
}

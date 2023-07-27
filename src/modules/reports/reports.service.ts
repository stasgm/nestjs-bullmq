import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Report } from '@prisma/client';

import { REPORT_BUILDER_QUEUE } from './queues/reports.constants';
import { ReportsRepository } from './reports.repository';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { BuildReportDto } from './dto/build-report.dto';

export interface ReportWithStatus extends Report {
  progress: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectQueue(REPORT_BUILDER_QUEUE) private readonly reportsQueue: Queue,
    private productsRepository: ReportsRepository,
  ) {}

  async findAll(): Promise<ReportWithStatus[]> {
    const reports = await this.productsRepository.getReports({});

    const reportList: ReportWithStatus[] = [];
    for await (const report of reports) {
      const job = await this.reportsQueue.getJob(report.jobId);
      if (job) {
        reportList.push({ ...report, progress: job.progress as number });
      }
    }

    return reportList;
  }

  findById(id: string): Promise<Report | null> {
    return this.productsRepository.getReport({ where: { id } });
  }

  create(createReportDto: CreateReportDto): Promise<Report> {
    return this.productsRepository.createReport({ data: createReportDto });
  }

  update(id: string, updateReportDto: UpdateReportDto): Promise<Report | null> {
    return this.productsRepository.updateReport({
      where: { id },
      data: updateReportDto,
    });
  }

  remove(id: string): Promise<Report | null> {
    return this.productsRepository.deleteReport({ where: { id } });
  }

  updateStatusByJobId(jobId: string, status: string): Promise<Report | null> {
    return this.productsRepository.updateReport({
      where: { jobId: jobId },
      data: {
        status,
      },
    });
  }

  async build(buildReportDto: BuildReportDto): Promise<void> {
    const job = await this.reportsQueue.add('reports', buildReportDto);

    await this.create({
      name: job.data.name,
      params: job.data.params,
      jobId: job.id,
      path: `./${job.data.name}-${job.id}`,
    });
  }

  async stopBuild(id: string): Promise<void> {
    const job = await this.reportsQueue.getJob(id);
    job.discard();
  }
}

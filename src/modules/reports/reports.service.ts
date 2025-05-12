import { Injectable } from '@nestjs/common';
import { Report } from '@prisma/client';
import { randomUUID } from 'crypto';

import { REPORTS_QUEUE } from '@/modules/core/jobs/producers/producers.types';
import { JobsProducersService } from '@/modules/core/jobs/producers/producers.service';
import { ReportsRepository } from '@/modules/reports/reports.repository';
import { BuildReportDto } from '@/modules/reports/dto/build-report.dto';

export interface ReportWithStatus extends Report {
  progress: number;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly jobsProducersService: JobsProducersService,
    private readonly reportsRepository: ReportsRepository,
  ) {}

  async findAll(params: { status?: string }): Promise<ReportWithStatus[]> {
    // TODO: add additional filters
    const reports = await this.reportsRepository.getReports({ where: { status: params.status } });

    return reports.map((report) => ({
      ...report,
      progress: 0, // TODO: get progress from job
      // progress: job?.progress as number ?? 0,
    }));
    // return Promise.all(
    //   reports.map(async (report) => {
    //     const job = await this.jobsProducersService.getJob(REPORTS_QUEUE, report.jobId);
    //     return {
    //       ...report,
    //       progress: (job?.progress as number) ?? 0,
    //     };
    //   }),
    // );
  }

  findById(id: string): Promise<Report | null> {
    return this.reportsRepository.getReport({ where: { id } });
  }

  remove(id: string): Promise<Report | null> {
    // TODO: implement soft delete
    return this.reportsRepository.deleteReport({ where: { id } });
  }

  async updateStatusById(id: string, status: string): Promise<Report | null> {
   return this.reportsRepository.updateReport({
      where: { id },
      data: { status },
    });
  }

  async build({ createdBy = 'system', ...buildReportDto }: BuildReportDto & { createdBy?: string }): Promise<Report> {
    // TODO: implement taking createdBy from request

    const report = await this.reportsRepository.createReport({
      data: {
        name: buildReportDto.name,
        params: buildReportDto.params,
        startedBy: createdBy,
      },
    });

    await this.jobsProducersService.insertNewJob({
      name: REPORTS_QUEUE,
      data: { createdBy, ...buildReportDto, reportId: report.id },
    });

    return report;
  }

  async pauseBuild(id: string): Promise<void> {
    const job = await this.jobsProducersService.getJob(REPORTS_QUEUE, id);
    if (!job) {
      throw new Error(`Job with id ${id} not found`);
    }
    // job.moveToWait()
  }

  async stopBuild(id: string): Promise<void> {
    const job = await this.jobsProducersService.getJob(REPORTS_QUEUE, id);

    if (!job) {
      throw new Error(`Job with id ${id} not found`);
    }

    const token = randomUUID();
    job.moveToFailed(new Error('Job stopped manually'), token);
  }
}

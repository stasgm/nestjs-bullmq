import { Injectable } from '@nestjs/common';
import { Prisma, Report } from '@prisma/client';

import { PrismaService } from '../_core/persistence/prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getReport(params: { where: Prisma.ReportWhereUniqueInput }): Promise<Report | null> {
    const { where } = params;
    return this.prisma.report.findUnique({ where });
  }

  async getReports(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ReportWhereUniqueInput;
    where?: Prisma.ReportWhereInput;
    orderBy?: Prisma.ReportOrderByWithRelationInput;
  }): Promise<Report[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.report.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createReport(params: { data: CreateReportDto }): Promise<Report> {
    const { data } = params;

    return this.prisma.report.create({
      data: {
        name: data.name,
        params: data.params,
        path: data.path,
        jobId: data.jobId,
        status: 'created',
      },
    });
  }

  async updateReport(params: {
    where: Prisma.ReportWhereUniqueInput;
    data: Prisma.ReportUpdateInput;
  }): Promise<Report> {
    const { where, data } = params;
    return this.prisma.report.update({ where, data });
  }

  async deleteReport(params: { where: Prisma.ReportWhereUniqueInput }): Promise<Report> {
    const { where } = params;
    return this.prisma.report.delete({ where });
  }

  async deleteReports(params: { where?: Prisma.ReportWhereUniqueInput }): Promise<Prisma.BatchPayload> {
    const { where } = params;
    return this.prisma.report.deleteMany({ where });
  }
}

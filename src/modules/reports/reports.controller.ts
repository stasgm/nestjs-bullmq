import { Body, Controller, Post, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getReports(): Promise<any> {
    return this.reportsService.getAll();
  }

  @Post('build')
  async start(
    @Body() body: { dateBegin: string; dateEnd: string },
  ): Promise<void> {
    this.reportsService.build(body.dateBegin, body.dateEnd);
  }
}

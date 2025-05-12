import { Body, Controller, Post, Get, NotFoundException, Param, Delete } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { BuildReportDto } from './dto/build-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll() {
    // TODO: add additional filters
    return this.reportsService.findAll({});
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const res = await this.reportsService.findById(id);

    if (!res) {
      throw new NotFoundException();
    }

    return res;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }

  @Post('build')
  async start(@Body() body: BuildReportDto): Promise<void> {
    this.reportsService.build(body);
  }

  @Post('stop-building')
  stopBuilidng(@Param('id') id: string) {
    this.reportsService.stopBuild(id);
  }
}

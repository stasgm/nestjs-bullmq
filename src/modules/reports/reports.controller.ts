import { Body, Controller, Post, Get, NotFoundException, Param, Delete } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { BuildReportDto } from './dto/build-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  findAll() {
    return this.reportsService.findAll();
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
    this.reportsService.build({
      params: body.params,
      name: body.name,
      fail: body.fail,
    });
  }

  @Delete('stop-building')
  post(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}

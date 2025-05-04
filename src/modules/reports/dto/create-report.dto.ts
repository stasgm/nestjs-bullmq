export class CreateReportDto {
  name: string;
  params: Record<string, any>;
  path: string;
  jobId: string;
}

import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const buildReportSchema = z.object({
  name: z.string({
    required_error: 'Name is required',
    invalid_type_error: 'Name must be a string',
  }).min(1, 'Name cannot be empty'),
  params: z.record(z.string(), z.any(), {
    required_error: 'Params object is required',
    invalid_type_error: 'Params must be an object with string keys',
  }),
}).strict();

export type BuildReport = z.infer<typeof buildReportSchema>;

// Create a DTO class from the schema
export class BuildReportDto extends createZodDto(buildReportSchema) implements BuildReport {
  name: string;
  params: Record<string, any>;
}
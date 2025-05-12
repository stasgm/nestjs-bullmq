import { BackoffOptions, JobsOptions } from 'bullmq';

export type InsertNewJobType<T extends keyof JobDataTypes> = {
  /** Queue name, same will be used as job name */
  name: T;

  /** Job data */
  data: JobDataTypes[T];

  /** Defaults to 'system' */
  createdBy?: string;

  /** Specify time when this job should run. By default its set to AppDate.getDate().
   * OR you can specify a delay in milliseconds after which this job should run at.
   * @example
   * 1. insertNewJob({ name: '{testJob}' }) // This job will at AppDate.getDate()
   * 2. insertNewJob({ name: '{testJob}', runAt: 30 }) // This job will 30 milliseconds from AppDate.getDate()
   * 3. insertNewJob({ name: '{testJob}', runAt: new Date(2030, 10, 10) }) // This job will run at 2030-10-10 */
  runAt?: Date | number;

  /** Max number of retries before backing off */
  maxRetries?: number;

  /** The higher the integer value, the higher the priority of the job.
   * @example A job with priority level 10 has a higher priority than a job with priority level 5. */
  priority?: number;

  /** Job backoff options that override queue's backoff options */
  backoff?: number | BackoffOptions;

  options?: JobsOptions;
};

export const getBullmqPrefix = (env: string) => `${env.toUpperCase().at(0)}-BULLMQ-JOBS`;

/** Queues and jobs */
export const REPORTS_QUEUE = '{REPORT-QUEUE}';
export const REPORT_BUILDER_JOB = 'REPORT_JOB';

/** Report builder job data */
export type ReportsJobData<T extends Record<string, any> = Record<string, any>> = {
  name: string;
  params: T;
  createdBy: string;
  reportId: string;
};

/** Mail job data */
export const MAIL_QUEUE = '{MAIL-QUEUE}';
export const MAIL_JOB = 'MAIL_JOB';
export type MailJobData = {
  to: string;
  subject: string;
  body: string;
  attachments?: string[];
};

/** All job types */
export type JobTypes = typeof MAIL_JOB | typeof REPORT_BUILDER_JOB;
export type QueueTypes = typeof MAIL_QUEUE | typeof REPORTS_QUEUE;

export type JobDataTypes = {
  [MAIL_QUEUE]: MailJobData;
  [REPORTS_QUEUE]: ReportsJobData;
};

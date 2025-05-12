import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailProcessor } from './mail.processor';
// import { Job } from 'bullmq';
import { DeepMockProxy } from 'jest-mock-extended';
import { GoogleMailService } from '@/modules/mail/google-mail.service';

describe('MailProcessor', () => {
  let mailProcessor: MailProcessor;
  let googleMailService: DeepMockProxy<GoogleMailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailProcessor,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: GoogleMailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    mailProcessor = module.get<MailProcessor>(MailProcessor);
    googleMailService = module.get(GoogleMailService);
  });

  it('should be defined', () => {
    expect(mailProcessor).toBeDefined();
    expect(googleMailService).toBeDefined();
  });

  // describe('process', () => {
  //   const mockJob = {
  //     id: 'test-job-id',
  //     data: {
  //       to: 'recipient@example.com',
  //       subject: 'Test Subject',
  //       text: 'Test Message',
  //     },
  //   } as Job;

  //   it('should process email successfully', async () => {
  //     await processor.process(mockJob);
  //     expect(googleMailService.sendEmail).toHaveBeenCalledWith({
  //       to: mockJob.data.to,
  //       subject: mockJob.data.subject,
  //       text: mockJob.data.text,
  //     });
  //   });

  //   it('should skip sending when mock mailing is enabled', async () => {
  //     (configService.get as jest.Mock).mockReturnValue(true);
  //     await processor.process(mockJob);
  //     expect(googleMailService.sendEmail).not.toHaveBeenCalled();
  //   });

  //   it('should throw error when email sending fails', async () => {
  //     const error = new Error('Failed to send email');
  //     googleMailService.sendEmail.mockRejectedValue(error);
  //     await expect(processor.process(mockJob)).rejects.toThrow(error);
  //   });
  // });

  // describe('onCompleted', () => {
  //   it('should log completion', async () => {
  //     const spy = jest.spyOn(processor['logger'], 'log');
  //     await processor.onCompleted({ id: 'test-id', data: {} });
  //     expect(spy).toHaveBeenCalledWith(expect.stringContaining('Completed email send'));
  //   });
  // });

  // describe('onFailed', () => {
  //   it('should log failure', () => {
  //     const spy = jest.spyOn(processor['logger'], 'error');
  //     processor.onFailed({ id: 'test-id', data: {} });
  //     expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed email send'));
  //   });
  // });
});

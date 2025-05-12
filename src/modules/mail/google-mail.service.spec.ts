import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleMailService } from './google-mail.service';
import { google } from 'googleapis';

jest.mock('googleapis');
jest.mock('google-auth-library');

describe('GoogleMailService', () => {
  let service: GoogleMailService;
  let configService: ConfigService;

  const mockConfig = {
    GOOGLE_API_CLIENT_ID: 'test-client-id',
    GOOGLE_API_CLIENT_SECRET: 'test-client-secret',
    GOOGLE_API_REFRESH_TOKEN: 'test-refresh-token',
    GOOGLE_API_EMAIL: 'test@example.com',
    GOOGLE_API_REDIRECT_URI: 'http://localhost:3000/auth/callback',
    GMAIL_USER: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleMailService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => mockConfig[key]),
          },
        },
      ],
    }).compile();

    service = module.get<GoogleMailService>(GoogleMailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize OAuth client and authorize', async () => {
      await service.onModuleInit();
      expect(google.auth.OAuth2).toHaveBeenCalledWith(
        mockConfig.GOOGLE_API_CLIENT_ID,
        mockConfig.GOOGLE_API_CLIENT_SECRET,
        mockConfig.GOOGLE_API_REDIRECT_URI,
      );
    });

    it('should throw error if required config is missing', async () => {
      (configService.getOrThrow as jest.Mock).mockImplementation(() => {
        throw new Error('Config not found');
      });

      await expect(service.onModuleInit()).rejects.toThrow('Config not found');
    });
  });

  describe('generateAuthUrl', () => {
    it('should generate a valid auth URL', () => {
      const mockGenerateAuthUrl = jest.fn().mockReturnValue('https://auth.url');
      (google.auth.OAuth2 as unknown as jest.Mock).mockImplementation(() => ({
        generateAuthUrl: mockGenerateAuthUrl,
      }));

      const authUrl = service.generateAuthUrl();
      expect(authUrl).toBe('https://auth.url');
      expect(mockGenerateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.send'],
        prompt: 'consent',
      });
    });
  });

  describe('sendEmail', () => {
    const mockEmailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Message',
    };

    beforeEach(() => {
      const mockGmail = {
        users: {
          messages: {
            send: jest.fn().mockResolvedValue({}),
          },
        },
      };

      (google.gmail as jest.Mock).mockReturnValue(mockGmail);
    });

    it('should send email successfully', async () => {
      await service.sendEmail(mockEmailOptions);
      expect(google.gmail({ version: 'v1' }).users.messages.send).toHaveBeenCalledWith({
        userId: 'me',
        requestBody: {
          raw: expect.any(String),
        },
      });
    });

    it('should properly format email message', async () => {
      await service.sendEmail(mockEmailOptions);
      const sendCall = (google.gmail({ version: 'v1' }).users.messages.send as jest.Mock).mock.calls[0][0];
      const rawMessage = Buffer.from(sendCall.requestBody.raw, 'base64').toString();

      expect(rawMessage).toContain(`From: ${mockConfig.GMAIL_USER}`);
      expect(rawMessage).toContain(`To: ${mockEmailOptions.to}`);
      expect(rawMessage).toContain(`Subject: ${mockEmailOptions.subject}`);
      expect(rawMessage).toContain(mockEmailOptions.text);
    });

    it('should throw GoogleMailError on failure', async () => {
      const error = new Error('API Error');
      (google.gmail({ version: 'v1' }).users.messages.send as jest.Mock).mockRejectedValue(error);

      await expect(service.sendEmail(mockEmailOptions)).rejects.toThrow('Failed to send email');
    });
  });

  describe('authorize', () => {
    it('should set credentials successfully', async () => {
      const mockSetCredentials = jest.fn();
      (google.auth.OAuth2 as unknown as jest.Mock).mockImplementation(() => ({
        setCredentials: mockSetCredentials,
      }));

      await service['authorize']();
      expect(mockSetCredentials).toHaveBeenCalledWith({
        refresh_token: mockConfig.GOOGLE_API_REFRESH_TOKEN,
      });
    });

    it('should throw GoogleMailError on authorization failure', async () => {
      const error = new Error('Auth Error');
      (google.auth.OAuth2 as unknown as jest.Mock).mockImplementation(() => ({
        setCredentials: jest.fn().mockRejectedValue(error),
      }));

      await expect(service['authorize']()).rejects.toThrow('Failed to authorize with Google OAuth2');
    });
  });
});

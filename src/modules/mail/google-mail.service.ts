import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { AppConfig } from '@/modules/core/AppConfig';
import { getErrorMessage } from '@/libs/helpers';

type GoogleMailConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
  gmailUser: string;
};

class GoogleMailError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'GoogleMailError';
  }
}

@Injectable()
export class GoogleMailService implements OnModuleInit {
  private oAuth2Client: OAuth2Client | undefined;
  private gmail: ReturnType<typeof google.gmail> | undefined;
  private config: GoogleMailConfig | undefined;
  private readonly logger: Logger;

  constructor(private readonly appConfig: AppConfig) {
    this.logger = new Logger('GoogleMailService');
  }

  async onModuleInit() {
    try {
      this.config = this.appConfig.googleApiConfig;
      this.oAuth2Client = new OAuth2Client(this.config.clientId, this.config.clientSecret, this.config.redirectUri);

      this.oAuth2Client.setCredentials({
        refresh_token: this.config.refreshToken,
      });

      this.gmail = google.gmail({ version: 'v1', auth: this.oAuth2Client });
      this.logger.log('Google Mail Service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Google Mail Service: ${getErrorMessage(error)}`);
      throw new GoogleMailError('Failed to initialize Google Mail Service', error);
    }
  }

  /**
   * Generates an OAuth2 authorization URL for the user to authenticate
   * @returns The authorization URL
   */
  generateAuthUrl(): string {
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.send'],
      prompt: 'consent',
    });
  }

  /**
   * Sends an email using Gmail API
   * @param options Email options including recipient, subject, and content
   * @throws {GoogleMailError} If email sending fails
   */
  async sendEmail(params: { to: string; subject: string; body: string }) {
    try {
      const { to, subject, body } = params;

      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        'From: ' + this.config.gmailUser, // TODO: add from no-reply@
        'To: ' + to,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body,
      ];
      const message = messageParts.join('\n');

      // The body needs to be base64url encoded.
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .trimEnd()
        .replace(/=/g, '');

      await this.gmail.users.messages.send({
        userId: 'me', // TODO: add user id
        requestBody: {
          raw: encodedMessage,
        },
      });

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${getErrorMessage(error)}`);
      throw new GoogleMailError('Failed to send email', error);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IOAuthUser,
  IGoogleTokenResponse,
  IGoogleUserResponse,
  IGithubTokenResponse,
  IGithubUserResponse,
  IGithubEmailResponse,
} from '../../../common/types';
import { LOG_MESSAGES } from '../../../common/constants';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(private configService: ConfigService) {}

  async handleGoogleLogin(
    code: string,
    redirectUri: string,
  ): Promise<IOAuthUser | null> {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id:
            this.configService.get<string>('oauth.google.clientId') || '',
          client_secret:
            this.configService.get<string>('oauth.google.clientSecret') || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        this.logger.error(
          LOG_MESSAGES.OAUTH_GOOGLE_TOKEN_FAILED,
          await tokenResponse.text(),
        );
        return null;
      }

      const tokens = (await tokenResponse.json()) as IGoogleTokenResponse;

      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        },
      );

      if (!userInfoResponse.ok) {
        this.logger.error(LOG_MESSAGES.OAUTH_GOOGLE_USER_FAILED);
        return null;
      }

      const userInfo = (await userInfoResponse.json()) as IGoogleUserResponse;

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.picture,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.OAUTH_GOOGLE_ERROR, error);
      return null;
    }
  }

  async handleGithubLogin(
    code: string,
    redirectUri: string,
  ): Promise<IOAuthUser | null> {
    try {
      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            code,
            client_id: this.configService.get<string>('oauth.github.clientId'),
            client_secret: this.configService.get<string>(
              'oauth.github.clientSecret',
            ),
            redirect_uri: redirectUri,
          }),
        },
      );

      if (!tokenResponse.ok) {
        this.logger.error(LOG_MESSAGES.OAUTH_GITHUB_TOKEN_FAILED);
        return null;
      }

      const tokens = (await tokenResponse.json()) as IGithubTokenResponse;

      if (tokens.error) {
        this.logger.error(
          LOG_MESSAGES.OAUTH_GITHUB_ERROR,
          tokens.error_description,
        );
        return null;
      }

      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!userResponse.ok) {
        this.logger.error(LOG_MESSAGES.OAUTH_GITHUB_USER_FAILED);
        return null;
      }

      const userInfo = (await userResponse.json()) as IGithubUserResponse;

      let email = userInfo.email;
      if (!email) {
        const emailsResponse = await fetch(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          },
        );

        if (emailsResponse.ok) {
          const emails =
            (await emailsResponse.json()) as IGithubEmailResponse[];
          const primaryEmail = emails.find((e) => e.primary);
          email = primaryEmail?.email || emails[0]?.email;
        }
      }

      if (!email) {
        this.logger.error(LOG_MESSAGES.OAUTH_GITHUB_NO_EMAIL);
        return null;
      }

      return {
        id: String(userInfo.id),
        email,
        name: userInfo.name || userInfo.login,
        avatarUrl: userInfo.avatar_url,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.OAUTH_GITHUB_ERROR, error);
      return null;
    }
  }
}

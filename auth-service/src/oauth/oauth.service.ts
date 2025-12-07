import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user';
import { IOAuthUserInfo } from 'src/interfaces';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  async handleGoogleLogin(code: string, redirectUri: string): Promise<IOAuthUserInfo | null> {
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: this.configService.get<string>('oauth.google.clientId') || '',
          client_secret: this.configService.get<string>('oauth.google.clientSecret') || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        this.logger.error('Google token exchange failed:', await tokenResponse.text());
        return null;
      }

      const tokens = await tokenResponse.json();

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResponse.ok) {
        this.logger.error('Google user info fetch failed');
        return null;
      }

      const userInfo = await userInfoResponse.json();

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.picture,
      };
    } catch (error) {
      this.logger.error('Google OAuth error:', error);
      return null;
    }
  }

  async handleGithubLogin(code: string, redirectUri: string): Promise<IOAuthUserInfo | null> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          code,
          client_id: this.configService.get<string>('oauth.github.clientId'),
          client_secret: this.configService.get<string>('oauth.github.clientSecret'),
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        this.logger.error('GitHub token exchange failed');
        return null;
      }

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        this.logger.error('GitHub OAuth error:', tokens.error_description);
        return null;
      }

      // Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!userResponse.ok) {
        this.logger.error('GitHub user info fetch failed');
        return null;
      }

      const userInfo = await userResponse.json();

      // Get user email (may need separate call if email is private)
      let email = userInfo.email;
      if (!email) {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (emailsResponse.ok) {
          const emails = await emailsResponse.json();
          const primaryEmail = emails.find((e: any) => e.primary);
          email = primaryEmail?.email || emails[0]?.email;
        }
      }

      if (!email) {
        this.logger.error('Could not get email from GitHub');
        return null;
      }

      return {
        id: String(userInfo.id),
        email,
        name: userInfo.name || userInfo.login,
        avatarUrl: userInfo.avatar_url,
      };
    } catch (error) {
      this.logger.error('GitHub OAuth error:', error);
      return null;
    }
  }
}

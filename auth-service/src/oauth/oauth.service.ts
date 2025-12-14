import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user';
import { IOAuthUserInfo } from 'src/interfaces';

/**
 * Service for handling OAuth authentication with Google and GitHub.
 * Exchanges authorization codes for tokens and fetches user profile info.
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  /**
   * Handle Google OAuth login.
   * Exchanges authorization code for access token and fetches user info.
   * @param code - Authorization code from Google OAuth redirect
   * @param redirectUri - Must match the redirect_uri used in the auth request
   * @returns User info if successful, null on failure
   */
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

      // Fetch user profile
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

  /**
   * Handle GitHub OAuth login.
   * Exchanges authorization code for access token and fetches user info.
   * Handles private email addresses by fetching from /user/emails endpoint.
   * @param code - Authorization code from GitHub OAuth redirect
   * @param redirectUri - Must match the redirect_uri used in the auth request
   * @returns User info if successful, null on failure
   */
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

      // Fetch user profile
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

      // GitHub may have private email - fetch from /user/emails if needed
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

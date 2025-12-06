import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { appConfig } from '../../config/app.config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: appConfig.githubClientId || '',
      clientSecret: appConfig.githubClientSecret || '',
      callbackURL: `${appConfig.backendUrl}/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { username, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      username,
      picture: photos[0].value,
      accessToken,
    };

    done(null, user);
  }
}
